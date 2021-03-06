/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
// arrayMethods = Object.create(Array.prototype)
// 等价于 const arrayKeys = Object.getOwnPropertyNames(Object.create(Array.prototype))

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 * 有些时候，我们在组件更新计算时，是需要禁止观察的
 */
export let shouldObserve: boolean = true // 标志位

export function toggleObserving (value: boolean) {
  shouldObserve = value
}


/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
// ------------------------------------------------------------- Observer
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    // value
    // - 比如 new Vue({data}) 中的 data
    // - 或者 data种的属性还是 对象或数组

    this.dep = new Dep()
    // this.dep
    // - 表示：每个 ( 对象或数组 ) 都对应一个 ( dep ) 实例
    // - 什么意思：就是data，以及data属性是一个对象和数组的属性都会有对应的dep实例
    // 1
    // - dep 中有哪些属性？
    //    - 静态属性：Dep.target 表示正在计算的 ( watcher )
    //    - 原型属性：
    //      - subs 用来存放订阅了dep的 ( watcher )
    //      - addSub
    //      - removeSub
    //      - depend notify
    // 2
    // - dep 主要用来做什么
    //    - 用来关联 ( data || data属性 ) <---> dep <---> watcher
    //    - dep.depend() ---> watcher.addDep(dep) ---> dep.addSubs(watcher)
    //    - 做依赖收集和派发更新
    // 3
    // dep => Observer 类中的 dep 主要是为了通过 value.__ob__.dep.depend 的方法来做依赖收集
    // 4
    // dep 和 watcher 是如何相互订阅的？
    // - 向 watcher 的 newDeps 中添加 dep
    // - 向 dep 的 subs 中添加 watcher


    this.vmCount = 0
    def(value, '__ob__', this)
    // def的作用
    // - 给 value 添加 __ob__ 属性，值是 observer 实例，不可枚举
    // - 相当于 value.__ob__ = this
    // - value在初始化时指的是 data
    // - this 指的是 observer 实例
    // - value.__ob__ 的 __ob__ 属性是不可枚举的，因为第四个参数是 undefined
    // - ！！！注意：这里的value不一定是data对象，因为data会递归的执行，这里的value也可能是value中的属性

    // 注意
    // 1.  __ob__ 属性只有被观察过的 对象或数组才具有
    // 2. value.__ob__ 的 __ob__ 属性是不可枚举的，因为第四个参数是 undefined

    // 扩展
    // value.__ob__ = this，不可枚举，初始化时value是data
    // - 不可枚举的属性不能被 for...in 和 Object.keys() 遍历
    // - 但是可以被 Reflect.ownKeys() 遍历
    // - 扩展：对象Symbol类型的key 在 for...in 和 Object.keys() 和 Reflect.ownKeys() 和 Object.getOwnPropertyNames() 遍历时的差异性

    // 扩展
    // 这里def的第四个参数不存在，说明 __ob__ 属性是不可枚举的，所以不能被
    // - Object.keys() 遍历自身属性 + 可枚举属性
    // - Object.getOwnPropertyNames() 遍历 自身属性 + 可枚举属性 + 不可枚举属性
    // - for...in 遍历自身 + 继承的属性 + 可枚举的属性
    // - key in Object 自身 + 继承的属性

    // def
    // export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
    //   Object.defineProperty(obj, key, {
    //     value: val,
    //     writable: true,
    //     enumerable: !!enumerable,
    //     configurable: true
    //   })
    // }

    // -------------------------------------------------------- 1. value 是数组
    if (Array.isArray(value)) {
      if (hasProto) {
        // 1
        // hasProto
        // export const hasProto = '__proto__' in {}
        // 表示：该环境中存在 __proto__ 属性，说明是浏览器环境
        // 注意：in 会包含 自身属性+继承的属性
        // 2
        // in
        // 'name' in { name: 'woow_wu7' }
        // 作用：in 用来判断 对象中是否包含某个属性
        // 注意：in判断的是 ( 自身属性 + 继承的属性 )
        // 对比：Object.keys() Object.getOwnPropertyNames() for...in 和 property in object
        // 3
        // function protoAugment (target, src: Object) {
        //   target.__proto__ = src
        // }
        // 3.1
        // const arrayMethods = Object.create(Array.prototype)
        // 这里需要进入源文件中看，因为重写了7中数组方法，并且绑定到了
        // 3.2
        // const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
        // - 注意：Object.getOwnPropertyNames() 获取 ( 自身属性 + 可枚举属性 + 不可枚举属性 )
        // 4
        // function copyAugment (target: Object, src: Object, keys: Array<string>) {
        //   for (let i = 0, l = keys.length; i < l; i++) {
        //     const key = keys[i]
        //     def(target, key, src[key])
        //   }
        // }

        protoAugment(value, arrayMethods) // ------------------ 如果是数组并且__proto__存在
        // 2
        // protoAugment
        // protoAugment(value, arrayMethods)
        // function protoAugment (target, src: Object) {
        //   target.__proto__ = src
        // }
        // 作用：让value继承了重写的7中数组方法的对象

        // 2
        // arrayMethods
        // - 是一个数组，上面从写了7种数组中的方法，然后对添加的成员继续observe，并且手动dep.notify()
      } else {
        // 不存在 {}.__proto__
        copyAugment(value, arrayMethods, arrayKeys) // -------- 如果是数组并且不存在__proto__
        // copyAugment(value, arrayMethods, arrayKeys)
        // - 的作用也是一样：就是让value可以继承重写了7种方法的数组
      }

      // 观测 - 数组
      this.observeArray(value)
      // observeArray (items: Array<any>) {
      //   for (let i = 0, l = items.length; i < l; i++) {
      //     observe(items[i])
      //     // 观测数组每个成员，在observe中会做 ( 依赖收集 ) 和 ( 派发更新 ) 的流程
      //   }
      // }
      // 注意注意注意：
      // 1. 这里观测是是 value 本身
      // 2. 在 arrayMethods 上也进行了观测，观测的是 添加方法push，unshift, splice 包装成的数组，并且手动dep.notify()
    } else {
      // ------------------------------------------------------ 2. value 是对象
      // 观测 - 对象
      // value 不是数组，则 观测对象
      // - 说明 value 是一个对象
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * // 该函数在 参数 是一个 对象 时调用
   * // walk 是遍历所有属性，并转换 getter 和 setter 函数
   */
  walk (obj: Object) {
    const keys = Object.keys(obj) // 遍历自身属性 + 可枚举属性
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
      // 定义响应式对象，将每个属性变为响应式数据
    }
  }

  /**
   * Observe a list of Array items.
   * 观测数组
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
      // 观测数组每个成员，在observe中会做 ( 依赖收集 ) 和 ( 派发更新 ) 的流程
      // 注意点：这里观察的是数组成员，但是只有数组成员还是 ( 对象或数组 ) 时在observe中才会继续往下做处理
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * 试图为value创建一个observer实例
 * returns the new observer if successfully observed,
 * 如果观测成功就会返回一个新的 observer 实例
 * or the existing observer if the value already has one.
 * 如果value已经存在，就返回存在的 observer
 */
// observe(data, true /* asRootData */)
// 返回：ob对象 -> Observer | void
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    // 如果 value 不是一个 ( 对象 或 数组 ) 或者 ( 是一个 VNode 实例 )，则直接返回
    // 注意：
    //  - 这里value可以是对象，也可以是数组
    //  - 问题：为什么这里可以是数组？
    //  - 回答：因为除了 ( data本身可以进行observe() )，( data的属性属性也会observe() )，只是必须是对象和数组，不然会直接return

    // isObject
    // export function isObject (obj: mixed): boolean %checks {
    //   return obj !== null && typeof obj === 'object'
    //   其实就是 object 和 array
    // }
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // data存在 __ob__ 属性 并且 value.__ob__是一个observer对象
    // 即已经观测过了, 直接赋值
    // 观察过 -------> __ob__属性存在，则直接复用
    ob = value.__ob__
  } else if (
    // 未观察过 ------> 则通过 new Observer() 生成新的 ob
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value) // value = object ｜ array
  }
  if (asRootData && ob) {
    // 如果是根data即new Vue()初始化的时候传入的data 并且 ob 存在
    // vmCount++
    // 即统计被生成的次数
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 定义响应式属性
 */
// defineReactive(obj, keys[i])
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep() // data中的每一个属性都会对应一个 dep 实例

  const property = Object.getOwnPropertyDescriptor(obj, key)
  // Object.getOwnPropertyDescriptor(obj, key)
  // - 作用：获取 obj 对象中 key 属性对应的 ( 属性描述对象 )

  if (property && property.configurable === false) {
    return
    // 如果该属性 对应的 属性描述对象不能被修改，该属性不能被删除的话，直接返回
    // 下面要重写 getter 和 setter
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get // 获取 - 描述符对象中的get，data初始化声明的都没有get和set
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    // 如果 getter 不存在，或者 setter存在，满足其中一个条件则继续
    // 并且 defineReactive 中传入的参数有两个时候，即initData时是 defineReactive(obj, keys[i])
    val = obj[key]
    // 因为如果只有两个参数时，val是undefined，然后在这里重新赋值成 obj[key]
    // val是defineReactive()函数的第三个参数，这里被重新赋值了，即obj[key]
  }

  let childOb = !shallow && observe(val)
  // 初始化 initData 时，shallow=undefined
  // observe(obj[key]) 表示继续观察obj中的属性，如果条件成立的话
  // ( 结论 ) 这里表示的是：如果shallow不存在，就继续观察val，执行observe(val)
  //  - 如果val还是一个对象，则会继续往下执行，返回ob
  //  - 如果val不是一个对象，则返回undefined，则childOb=undefined
  // 继续观测对象的每一项的value值,如果还是对象就继续观察 添加响应Object.defineProperty
  // shallow：是浅的意思，表示不是浅观察的的话

  // depend依赖收集 和 notify派发更新
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      // value进行过依赖收集，就调用getter，否则将计算的值赋值给value
      if (Dep.target) { // ---------------------------- 当前正在观察的watcher
        dep.depend() // ------------------------------- 依赖收集
        if (childOb) { // ----------------------------- 如果子的 ob 存在，observer() 会返回ob，ob其实就是Observer构造函数执行生成的实例
          childOb.dep.depend() // --------------------- 继续做依赖收集，如果val还是一个对象或者数组并且未被observer
          if (Array.isArray(value)) {
            dependArray(value) // --------------------- 每个成员满足条件逐个做依赖收集
            // function dependArray (value: Array<any>) {
            //   for (let e, i = 0, l = value.length; i < l; i++) {
            //     e = value[i]
            //     e && e.__ob__ && e.__ob__.dep.depend()
            //     if (Array.isArray(e)) {
            //       dependArray(e)
            //     }
            //   }
            // }
          }
        }
      }
      return value // 处理完上面的逻辑后，返回该属性对应的值
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val // 求值
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
        // 现在设置的值，和之前设的值相等，就不走set，说明之前set过
        // 引用类型时，newVal !== newVal， value !== value
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal) // setter计算
      } else {
        val = newVal // 直接赋值
      }
      // set后重新做依赖收集
      childOb = !shallow && observe(newVal)
      // 派发更新
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 * Set是Vue对象的属性，添加，修改属性后触发更新，
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
    // 如果是开发环境 并且 target是undefined，null,或者原始数据类型，就抛出警告
    // 也就是说 target 只能是对象或者数组
  }

  // ------------------------------------------------------------------------ 处理数组
  if (Array.isArray(target) && isValidArrayIndex(key)) { // 如果target是数组类型，并且key是合法的下标类型及范围
    target.length = Math.max(target.length, key)
    // 取大的值
      // 比如:
      // target => [1,2,3]
      // Vue.set(target, 3, 4)
        // 1. target.length = 3
        // 2. key = 3
        // 12 得 max = 3
        // 最终：[1,2,3].splice(3, 1, 4) => [1,2,3,4]
    target.splice(key, 1, val)
    // 1
    // 删除后插入
    // 这里的 splice 是重写过后的 splice，具有响应式
    // 2
    // splice 原生方法
    // array.splice(数组下标-表示删除的起始位置, 删除的元素个数, 要插入的新元素1, 要插入的新元素2)
    // - 返回 ( 被删除的元素组成的数组 )
    // - 改变原数组
    // var a = ['a', 'b', 'c', 'd', 'e', 'f']
    // a.splice(4, 2, 1, 2) // ["e", "f"]
    // a // ["a", "b", "c", "d", 1, 2]
    return val
    // 返回值，注意 Vue.set() 是有返回值的，返回值就是操作的属性值
  }

  // ------------------------------------------------------------------------ 处理对象
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
    // 属性已经存在，直接赋新值
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    // 如果target是vue实例 或者 rootData
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    // 如果ob不存在，即target.__ob__不存在，说明不是响应式数据，即普通对象的修改，直接赋值返回
    // 非响应式数据，也能使用Vue.set()
    target[key] = val
    return val
  }

  defineReactive(ob.value, key, val)
   // defineReactive(ob.value, key, val)
    // 1. 作用就是给 value 对象的 key 属性添加响应式，访问get依赖收集，修改set派发更新
    // 2. 注意点：
      // ob.value = value
      // 这里参数有三个，所以val就是直接传入的值
    // 3. 特别重要的点
      // 在 defineReactive(ob.value, key, val) 中
        // 子对象属性依赖收集：let childOb = !shallow && observe(val) 如果value还是一个对象，就会子对象属性就行依赖收集就会继续观察变成响应式
        // 子对象本身依赖收集：childOb存在，childOb.dep.depend()，对子对象依赖收集

  ob.dep.notify()
  // 手动派发更新
  // 因为上面 defineReactive(ob.value, key, val) 更新是要值被修改后才会更新，而这里没有修改值，即 Vue.set()后手动更新
  // target.__ob__ = new Observer(target)
  // ob.dep.notify() = target.__ob__.dep.notify() 后续就会走派发更新的流程
  // 注意是：target对象的dep派发的更新，即从新渲染更新 target 的值

  // ob.dep.notify() 是重点

  return val
}

/**
 * Delete a property and trigger change if necessary.
 * 删除属性时触发响应式更新
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }

  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    // 1
    // 利用重写的splice删除这个数组中的下标对应的成员
    // key：这里表示数组的下标
    // target.splice(key, 1) 表示删除target数组key下标的值
    // array.splice(数组下标-表示删除的起始位置, 删除的元素个数, 要插入的新元素1, 要插入的新元素2)
    // - 返回 ( 被删除的元素组成的数组 )
    // - 改变原数组
    // 2
    // var a = ['a', 'b', 'c', 'd', 'e', 'f']
    // a.splice(4, 2, 1, 2) // ["e", "f"]
    // a // ["a", "b", "c", "d", 1, 2]
    return
  }

  const ob = (target: any).__ob__
  // 每个被观测的对象都有一个 ( __ob__ ) 属性，( 其实就是 rootData 以及 rootData的属性还是一个对象或者数组的属性 )
  // 即在 Observer 类中的构造函数中，就会把传入的 ( target.__ob__ = this )，this指向observer实例
  // observer实例上有 dep 属性
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) { // 要删除的属性不存在
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i] // 数组中的每一个项，如果具有__ob__属性，做dep.depend()依赖收集
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e) // 递归每一个项
    }
  }
}
