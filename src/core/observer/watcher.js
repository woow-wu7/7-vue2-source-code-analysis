/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  invokeWithErrorHandling,
  noop
} from '../util/index'

import { traverse } from './traverse'
import { queueWatcher } from './scheduler'
import Dep, { pushTarget, popTarget } from './dep'

import type { SimpleSet } from '../util/index'

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;
  // 上面就是声明的一些属性

  constructor (
    vm: Component,
    expOrFn: string | Function,
    // expOrFn
    // - 表达式 || 函数
    // - 1. computedWatcher 时，expOrFn 是 function
    //      - 1. 是 computed对象中 key 对应的 方法
    //      - 2. 是 computed对象中 key 对应的 对象中的 get 方法
    //      - 3. 因为 computed 对象中的 key 对应的值，可以是一个function||object
    // - 2. userWatcher 时，expOrFn是watch对象中的key字符串
    // - 3. renderWatcher 时，expOrFn是 function，即 updateComponent = () => { vm._update(vm._render(), hydrating) }

    cb: Function,
    // 1. computed时cb是一个noop空函数，
    // 2. watch的cb就是watch对象中key对应的 --- key变化时执行的函数，这里已经是将watch值的所有类型都处理成了function
    // 3. 渲染watcher时，cd是noop空函数

    options?: ?Object,
    // 1. computedWatcher时，options是 { lazy: true }
    // 2. userWatcher时，options是 { user: true }
    // 3. renderWatcher时，首次渲染时 options 是一个具有 before 方法的对象

    isRenderWatcher?: boolean
    // isRenderWatcher 是否是 renderWatcher 渲染watcher 的标志位
    // isRenderWatcher
    // 1. 表示是否是renderWatcher，---> 即是否是渲染watcher
    // 2. computedWatcher ----------> 没有传该参数即为undefined
  ) {
    this.vm = vm
    if (isRenderWatcher) { // watcher渲染watcher
      vm._watcher = this // vm._watcher 表示的就是渲染watcher
    }
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep // 是 user watcher 相关
      this.user = !!options.user // 是 user watcher 时，user=true，处理 watch 的逻辑
      this.lazy = !!options.lazy // 是 computed watcher 时，lazy=true，处理 computed 的逻辑
      this.sync = !!options.sync // 是 user watcher 相关
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
      // options 不存在时，默认都设置为 false
    }

    this.cb = cb
    // 第三个参数
    // - computed watcher -> cb 是一个空函数
    // - render watcher -> mount阶段，cb是一个noop空函数
    // - user watcher -> mount阶段，cb是一个函数，即watch对象中的key对象的handler函数

    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers，是 computed watcher 时，lazy=true
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString() // 字符串toString还是自身，函数toString将整个函数体转成字符串形式
      : ''
    // parse expression for getter

    // expOrFn
    // - 1. 函数：renderWatcher 或 computedWatcher 的 expOrFn 是一个函数
    // - 2. 字符串：userWatcher 的 expOrFn 是一个字符串，即 watch 时是字符串

    // 1
    // expOrFn 是一个函数即 renderWatcher 或 computedWatcher

    if (typeof expOrFn === 'function') { // 如果传入 Watcher 构造函数的 ( 第二个参数expOrFn是一个函数 )

      this.getter = expOrFn
      // computedWatcher时，expOrFn是computed对象中的每个方法
      // renderWatcher时，expOrFn是 updateComponent = () => { vm._update(vm._render(), hydrating) } 这样一个函数

    } else {
      // 2
      // expOrFn 是一个字符串
      // - 是一个字符串时，是一个 user watcher
      this.getter = parsePath(expOrFn)
      // this.getter 在 this.get() 方法中执行
      // parsePath
      // - 返回的是一个函数，该函数遍历expOrFn以 . 分割后的数组
      // - 返回的函数是：return function (obj) { for (let i = 0; i < segments.length; i++) { if (!obj) return obj = obj[segments[i]] } return obj }
      //    - 返回的函数的参数：obj -> 其实就是 vm 实例
      //    - obj[segments[i]] 其实就是访问到了 data 中的属性

      // 1
      // path.split('.')
      // 比如 watch 对象中有这样的情况
      //  'a.b'
      //    - { 'a.b': function(newValue, oldValue){...} }
      //    - 得到：['a', 'b']
      //  'c'
      //    - 得到：['c']


      // 2
      // export function parsePath (path: string): any {
      //   if (bailRE.test(path)) {
      //     return
      //   }
      //   const segments = path.split('.')
      //   return function (obj) {
      //     for (let i = 0; i < segments.length; i++) {
      //       if (!obj) return
      //       obj = obj[segments[i]]
      //     }
      //     return obj
      //   }
      // }
      // const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`)


      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }

    this.value = this.lazy // lazy是computedWatcher的标志，如果是computedWatcher，this.value=undefined，即不会立即求值
      ? undefined // computedWatcher ----------------> 不会立即求值，computedWatcher的lazy=true；this.value = undefined
      : this.get() // renderWatcher 和 userWatcher ---> 初始化时都会执行 this.get()

    // this.value
    // 1. computedWatcher
    //    - computedWatcher <-> computed
    ///   - this.value=undefined，即不会立即求值
    //    - 问题：那什么时候求值？
    //    - 回答：在 template 中访问到了 computed 定义的计算属性时会进行计算
    //    - 原理：
    //      - 过程：因为computed初始化时，会在defineComputed()函数中进行Object.defineProperty(target, key, sharedPropertyDefinition)，即get/set依赖收集和派发更新
    //      - 最终：执行 watcher.evaluate() --> watcher.get() --> watcher.getter.call(vm, vm) --> expOrFn() --> 就是computed对象key对应的方法
    //    - computed的特点
    //      - 1. computed只有在 ( 被访问时 ) 才会去进行计算，上面已经分析过了
    //      - 2. computed计算属性具有 ( 缓存功能 )
    //      - 3. computed的依赖必须是 ( 响应式数据 )，不然依赖更新，也不会重新计算
    //      - 4. computed的依赖项是响应式数据并且变化了，但是如果 ( 计算的结果不变 )，应用也 ( 不会重新渲染 )
    //    - 相关原理及分析地址
    //      - https://juejin.cn/post/6844904184035147790
    //      - https://github.com/woow-wu7/6-review/blob/main/STEP_20220319/vue/vue.md
    //      (1) computed只有在被访问时才会重新计算
    //        - 因为：在new Watcher是computed watcher时，即lazy=true时，在构造函数中没有立即执行get()方法，而是在计算属性被访问时触发computed的响应式get后，执行的get方法中回去调用computed getter函数
    //        - 之前：上面已经分析过了
    //      (2) computed具有缓存功能
    //        - 表现：表现为如果computed中的key被访问过，下次在访问不会再重新计算，而是直接返回之前计算好的值
    //        - 原理：
    //          - dirty=true，进行 watcher.evaluate() 执行computed的key对应的函数得到计算解结果
    //          - watcher.evaluate() 计算到结果后，又会将 dirty=false
    //          - 下次再访问到computed的key时，不会重新进行 watcher.evaluate() 的计算，而是直接返回之前计算好的结果，之前的值已经缓存在watcher.value中
    // - computedWatcher 补充
    // - 特点 ( 4 个特点 )
    // - 1. computed 声明后，只有在 computed 被访问时才会去计算，( 比如在 template 模版中被访问，methods 中被访问 )
    // - 2. computed 具有缓存功能，也就是说如果之前某个 computed 的 key 被访问过了，依赖的响应式数据没有变化，再次访问不会进行重新计算，而是直接返回之前计算好的值
    // - 3. computed 的依赖必须是响应式数据，不然依赖变化后，也不会触发 computed 重新计算
    // - 4. 即使 computed 的依赖变化了，但是 computed 计算的值并没有变化时，也不会重新渲染
    // - 优点
    // - 1. 对比模版中直接写逻辑
    //   - 不推荐: 比如在模版中写了反转字符串的逻辑，组件中还有其他地方也需要反转，`<div> {{ message.split('').reverse().join('') }} </div>`
    //   - 推荐: 以上不能复用逻辑，并且需要在模版中大量计算，并且缓存数据，computed 就能很好的解决
    // - 2. 对比 方法
    //   - 方法: 方法每次重渲染都会重新执行
    //   - 计算属性: 当 依赖的响应式数据 没有变化时，重渲染是直接使用的缓存的值
    // - 源码分析
    // - [computed源码分析](https://juejin.cn/post/6844904184035147790)
    // - [vue源码分析仓库](https://github.com/woow-wu7/7-vue2-source-code-analysis/blob/main/src/core/observer/watcher.js)
    
    // 2. userWatcher
    //    - userWatcher <-> watch
    //    - watch对象的key对应的value的类型
    //      - function --- 表示 key 变化时执行的函数
    //      - string ----- 表示 方法名 或 data.a对象.b属性
    //      - object ----- 对象中一定要有 handler 方法，{ handler, immediate, deep, sync }
    //      - array ------ 以上的组合
    //      - 最终都会把不同类型的 handler 转换成函数，然后执行  vm.$watch(expOrFn, handler, options)
    //      - 官网说明：https://cn.vuejs.org/v2/api/#watch
    //    - watch对象的value是对象时，支持的属性
    //      - deep：表示深度监听
    //      - immediate：表示立即执行callback，不用等到key变化时才去执行
    //      - sync：表示 ( 同步watch对象中的handler先执行 )，( 普通的watch对象的handler后执行 )
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    pushTarget(this) // 向 targetStack 栈中添加 watcher，并且把该 watcher 设置为 Dep.target 静态属性的值
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)
      // 执行 getter()，传入vm作为参数，求值
      // render Watcher 和 user watcher 都会执行 this.getter

      // render watcher 的 getter 是
      // -> updateComponent = () => { vm._update(vm._render(), hydrating) }

      // user watcher 的 getter 是
      // -> 是这样一个方法
      //   function (obj) {
      //     for (let i = 0; i < segments.length; i++) {
      //       if (!obj) return
      //       obj = obj[segments[i]]
      //     }
      //     return obj
      //   }
      // -> 并且当我们访问watcher中的属性，比如叫a字符串时，会访问 vm.a 就是对data进行访问，就会触发dep.depend()做依赖收集

      // value
      // 当是 userWatcher 时，value 就是 watch 的 key 对应的 vm[key] = vm.$options.data[key]
      // 其实就是：data中的属性

    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) { // deep用于深层对象的watch
        traverse(value) // 传入计算的结果值，即 data 中的属性，该属性还是一个对象
      }
      popTarget() // 出栈
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  // 1
  // 调用过程
  // 1. 通过 Dep.target.addDep(this) ---> 表示调用watcher对象上的addDep方法，参数是 dep 实例
  // 2. addDep() 方法的作用 -------------> 调用dep对象上的addSub方法，参数是 watcher 实例
  // 3. addSub() 方法的作用 -------------> 向dep对象上的subs数组中，添加watcher
  // 总结
  // - watcher.addDep(dep)
  // - dep.addSub(watcher)
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep) // 向当前正在计算的 watcher 的 newDeps 中添加 dep
      if (!this.depIds.has(id)) {
        dep.addSub(this)
        // this ------> 指 watcher
        // 向 dep 的 subs 中添加正在计算的 watcher
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes. 依赖变化时从新被执行
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) { // ------ computedWatcher 时 lazy=true
      this.dirty = true
    } else if (this.sync) { // watchWatcher时，sync情况的处理，优先执行
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   * 在调度中被回调调用
   */
  // 1 派发更新的流程
  // -> dep.subs -> watcher.update -> queueWatcher() -> flushSchedulerQueue() ->
  // -> watcher.run() -> watcher.get() -> vm._update(vm._render(), hydrating)
  run () {
    if (this.active) {
      const value = this.get()
      // this.get() === this.getter = expOrFn
      // expOrFn 是传入 Watcher() 构造函数的 第二个参数
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) { // userWatcher
          const info = `callback for watcher "${this.expression}"`
          invokeWithErrorHandling(this.cb, this.vm, [value, oldValue], this.vm, info)
        } else {
          this.cb.call(this.vm, value, oldValue)
          // watch对象中函数被执行，第一个参数是newValue，第二个参数是oldValue
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   * 计算watcher中的this.value，只用于lazy属性的watcher，即 computedWatcher
   */
  evaluate () {
    this.value = this.get() // watcher.get()会执行 ---> this.getter() ---> computedWatcher的getter是 expOrFn，即computed对象中的方法
    this.dirty = false // 计算完成后 dirty设置为false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend() // 执行所有 watcher.deps 中的 dep.depend() 方法
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
