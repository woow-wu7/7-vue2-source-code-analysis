/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 7 种原生数组方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method] // 获取到原生的这7中数组方法

  // export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  //   Object.defineProperty(obj, key, {
  //     value: val,
  //     enumerable: !!enumerable,
  //     writable: true,
  //     configurable: true
  //   })
  // }

  // def
  // 真正的修改数组7种方法的地方
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args) // 执行原生方法获得的结果
    const ob = this.__ob__
    let inserted // inserted是一个数组 或者就是在不满足所有switch条件时，未被赋值则是undefined
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2) // splice(start, count, addElement1, addElement2) 所以这里去除了前两个参数后，后面的参数就是要插入的参数
        break
    }

    if (inserted) ob.observeArray(inserted)
    // 1
    // 观测数组，传入数组方法的参数
    // 问题：这里为什么只传入 ( 添加进输入的成员组成的数组 ) ？
    // 回答：因为这里是添加操作的处理，即必须满足switch中的条件时才会执行 ob.observeArray(inserted) 操作

    // 2
    // notify change
    // 手动触发 - 派发更新的过程
    ob.dep.notify()
    return result // 返回方法执行后的结果
  })
})
