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
    expOrFn: string | Function, // 表达式 || 函数
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean  // 是否是renderWatcher，即渲染watcher
  ) {
    this.vm = vm
    if (isRenderWatcher) { // watcher渲染watcher
      vm._watcher = this
    }
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user // 是 user watcher 时，user=true，处理 watch 的逻辑
      this.lazy = !!options.lazy // 是 computed watcher 时，lazy=true，处理 computed 的逻辑
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
      // options 不存在时，默认都设置为 false
    }
    this.cb = cb // 第三个参数，当mount阶段时，cb是一个noop空函数
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers，是 computed watcher 时，lazy=true
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    // 1 expOrFn 是一个函数
    if (typeof expOrFn === 'function') {
      // 如果传入 Watcher 构造函数的 ( 第二个参数expOrFn是一个函数 )
      this.getter = expOrFn // computedWatcher时，expOrFn是computed对象中的每个方法
    } else {
      // 2 expOrFn 是一个字符串 -> 是一个字符串时，可能是一个 user watcher

      this.getter = parsePath(expOrFn)
      // this.getter 在 this.get() 方法中执行
      // parsePath
      // - 返回的是一个函数，该函数遍历expOrFn分割后的数组
      // - 返回的函数是：return function (obj) { for (let i = 0; i < segments.length; i++) { if (!obj) return obj = obj[segments[i]] } return obj }
      //    - 返回的函数的参数：obj -> 其实就是 vm 实例
      //    - obj[segments[i]] 其实就是访问到了 data 中的属性，
      // 1
      // path.split('.')
      // 比如 watch 对象中有这样的情况
      //  'a.b'
      //    - { 'a.b': function(newValue, oldValue){...} }
      //    - ['a', 'b']
      //  'c'
      //    - ['c']


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
    this.value = this.lazy
      ? undefined // computed不会立即求值，computedWatcher的lazy=true；this.value = undefined
      : this.get() // render watcher 和 user watcher 初始化时都会执行 this.get()
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
      // 执行getter()，传入vm作为参数，求值
      // render Watcher 和 user watcher 都会执行 this.getter
      // - render watcher 的 getter 是 -----> updateComponent = () => { vm._update(vm._render(), hydrating) }
      // - user watcher 的 getter 是 -------> watcher对象中的 handler方法，即watch对象中执行的函数；并且当我们访问watcher中的属性，比如叫a字符串时，会访问 vm.a 就是对data进行访问，就会触发dep.depend()做依赖收集
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
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
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
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
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true // this.dirty = this.lazy
    } else if (this.sync) {
      // watch，优先执行
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
          this.cb.call(this.vm, value, oldValue) // watch对象中函数被执行，第一个参数是newValue，第二个参数是oldValue
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
