/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 * dep是一个可观察对象，可以有多个指令订阅它
 */
export default class Dep {
  static target: ?Watcher;
  // target一个 watcher 类型的静态属性

  id: number;
  // 每次new都使id+1
  // 即每次执行都自增1

  subs: Array<Watcher>; // subs 是 watcher 类型的数组

  constructor () {
    this.id = uid++
    this.subs = []
  }

  // addSub
  // 添加 watcher
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  // removeSub
  // 删除 watcher
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
    // remove
    // export function remove (arr: Array<any>, item: any): Array<any> | void {
    //   if (arr.length) {
    //     const index = arr.indexOf(item)
    //     if (index > -1) {
    //       return arr.splice(index, 1)
    //     }
    //   }
    // }
  }

  // depend
  // 依赖收集
  depend () {
    if (Dep.target) {
      // Dep.target 是当前正在执行的正在计算的 watcher，存在闭包中，相当于全局变量
      // 在下面有初始化
      Dep.target.addDep(this)

      // addDep 方法的作用
      // 1. 向正在计算的 watcher 的 newDeps 中添加 dep
      // 2. 向 dep 的 subs 数组中添加 watcher
      // 12是相互订阅的过程

      // Dep.target ------------> 指的是一个正在计算的 watcher
      // this ------------------> 指的是 dep 实例对象
    }
  }

  // notify
  // 派发更新
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice() // 浅拷贝
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
      // 保证各种watcher的顺序
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update() // 执行 watcher 中的 update 方法
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
// Dep.target 表示正在进行计算的watcher，全局唯一，因为同一个时间只能有一个watcher在进行计算
// stack 栈
// heap 堆
Dep.target = null
const targetStack = []

// 入栈
export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

// 出栈
export function popTarget () {
  targetStack.pop() // 尾出
  Dep.target = targetStack[targetStack.length - 1] // 最后一个watcher
}
