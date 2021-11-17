/* @flow */

import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute,
  invokeWithErrorHandling
} from '../util/index'

// 公用的属性
// Object.defineProperty(obj, props, descriptor)
// - 参数
//  - descriptor 表示属性描述符
//    - 数据描述符对象 value writeable configurable enumerable
//    - 存取描述符对象 get set
const sharedPropertyDefinition = {
  enumerable: true, // 属性可枚举，枚举的属性可以被 Object.keys() Object.getOwnPropertyNames() for...in 遍历到
  configurable: true, // 表示可以修改 descriptor 属性描述对象，同时该属性是可删除的
  get: noop,
  set: noop
}

// proxy
// proxy(vm, `_data`, key)
// 主要作用
// - proxy函数的主要作用是
//  - 做了一层代理
//  - this.name === vm.name === vm._data.name === vm.$options.data.name === vm.$data.name
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  // 1. 重写了 get set 函数
  // 2. 整个逻辑表示：给 vm 实力添加 key 属性
  // 4. 重写了get和set之后
  //    - vm.key === vm._data.key
  //    - get和set中的this，指向的是vm实例，因为是通过vm去访问和修改的
  Object.defineProperty(target, key, sharedPropertyDefinition)
  // vm[key] === vm._data[key]
  // 因为： vm._data = vm.$options.data
  // 所以：vm[key] === vm._data[key] === vm.$data[key] === vm.$options.data[key]
}


// initState 初始化state
// initState -> initData
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options // 获取vm中掺入的配置对象 options
  if (opts.props) initProps(vm, opts.props) // ------------ initProps
  if (opts.methods) initMethods(vm, opts.methods) // ------ initMethods
  if (opts.data) {
    initData(vm)
    // ---------------------------------------------------- initData
  } else {
    // data 不存在，传入空对象作为初始化data -> rootData
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed) // --- initComputed
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch) // -------------------------- initWatch
    // 1
    // watch存在，并且不是原生的对象上的watch属性，就初始化 watch
    // 2
    // watcher 一共分为三种
    // computed watcher
    // render watcher
    // user watcher
  }
}

function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}

// initData
function initData (vm: Component) {
  let data = vm.$options.data
  // 1
  // data
  // 获取传入的 options 对象上的 data 属性
  // 注意：这里的 vm.$options 在不是组件的情况下，是合并后的 options

  // 2
  // vm -> 表示的 vue 的实例
  // vm.$options -> 就是传入Vue或组件实例的 ( 配置对象 )
  // vm.$data.a === vm.a -> vue会将vm中的options中的data中的属性，直接挂在到 vm 上，所以在vue组件中你可以使用 this.a 直接访问到 vm.$data.a
  // vm上还有很多带 $ 的属性，比如：
  // - vm.$data
  // - vm.$props
  // - vm.$el ...

  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  // vm.$options.data === vm._data === vm.$data
  // 3
  // data
  // data有两种情况
  // - data是一个 对象
  // - data是一个 函数
  //    - data 是函数时，就执行 getData(data, vm)
  //    - data是一个函数的好处：
  //      - 当一个组件被定义，data 必须声明为返回一个初始数据对象的函数，因为组件可能被用来创建多个实例
  //      - 如果data是对象：则所有实例都会 ( 共享引用 ) ( 同一个data对象 )
  //      - 如果data是函数：则每次新建实例，都会调用data函数，生成新的data对象，是不同的地址，独立不影响
  // - data不存在时，做了熔断处理，将 {} 赋值给 data

  if (!isPlainObject(data)) {
    // 判断是否是 plainObject 纯对象
    // 1
    // 什么是纯对象？
    // - plainObject是通过 ( 对象字面量方式声明{} ) 或者通过 ( Object.create() ) 生成的对象
    // - const obj = {}
    // - const obj = Object.create()
    // 2
    // isPlainObject 的函数定义如下
    // export function isPlainObject (obj: any): boolean {
    //   return  Object.prototype.toString.call(obj) === '[object Object]'
    // }
    // 3
    // 详见 README.md 文件 二
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
      // data函数必须返回一个对象
    )
    // 该if语句表示：如果data不是一个纯对象，先把data赋值为空对象，然后在开发环境中抛出警告
  }
  // proxy data on instance
  // 1. 判断 ( data ) 中的属性不能和 ( props, methods ) 中的属性 key 同名
  // 2. 判断是不是 reserve 保留字
  // 3. 通过12对data做一层代理
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      // hasOwn 函数的定义
      // export function hasOwn (obj: Object | Array<*>, key: string): boolean {
      //   return Object.prototype.hasOwnProperty.call(obj, key)
      // }
      if (methods && hasOwn(methods, key)) {
        // methods 对象中的 ( 方法名 ) 不能和 ( data中的key ) 同名
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      // ( data中的key ) 不能和 ( props中的key ) 同名
      // 理论上 props 优先
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      // 1
      // isReserved
      // reserve 是保留字的意思
      // export function isReserved (str: string): boolean {
      //   const c = (str + '').charCodeAt(0)
      //   return c === 0x24 || c === 0x5F
      // }
      // Check if a string starts with $ or _
      // 2
      // props，data，methods中没有同名的key，并且该key不是vue保留字，就执行代理 proxy 函数
      // vue 中 $ 和 _ 是保留字
      // 3
      // proxy 的作用：vm[key] = vm._data'[key]，即将data中的属性代理到vm上
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // data 的响应式
  // observer是有返回值的，返回的是一个ob对象，即 observer 对象实例
  // observe第二个参数，表示是否是 RootData
  observe(data, true /* asRootData */)
}

// getData
export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  // pushTarget
  // 1
  // pushTarget 是 Dep 类中的属性
  // export function pushTarget (target: ?Watcher) {
  //   targetStack.push(target)
  //   Dep.target = target
  // }
  // 2
  // 参数问题
  // 注意：
  // - 这里 pushTarget() 是没有传入参数的
  // - 所以 Dep.target = undefined，即表示正在计算的watcher不存在
  try {
    return data.call(vm, vm)
    // data.call(vm, vm)
    // 第一个参数：vm，因为通过call调用，所以第一个参数表示data函数中的this绑定在 data 对象上
    // 第二个参数：vm，是传入data函数中的数据，而我们业务方使用的时候，是不需要在传任何参数的
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget() // target出队列，targetStack = []，因为上面最开始时进入了队列
  }
}

const computedWatcherOptions = { lazy: true }

function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      } else if (vm.$options.methods && key in vm.$options.methods) {
        warn(`The computed property "${key}" is already defined as a method.`, vm)
      }
    }
  }
}

export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}

function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}

function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(expOrFn, handler, options)
}

export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      const info = `callback for immediate watcher "${watcher.expression}"`
      pushTarget()
      invokeWithErrorHandling(cb, vm, [watcher.value], vm, info)
      popTarget()
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
