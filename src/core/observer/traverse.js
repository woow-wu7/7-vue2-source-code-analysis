/* @flow */

import { _Set as Set, isObject } from '../util/index'
import type { SimpleSet } from '../util/index'
import VNode from '../vdom/vnode'

const seenObjects = new Set()

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
export function traverse (val: any) {
  _traverse(val, seenObjects)
  // seenObjects
  // - const seenObjects = new Set()

  seenObjects.clear()
}

function _traverse (val: any, seen: SimpleSet) {
  let i, keys

  const isA = Array.isArray(val) // 数组
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }

  if (val.__ob__) { // 如果 watch 中的 key，即在 data 中的 key 对应的值对象，具有 __ob__ 属性
    const depId = val.__ob__.dep.id // 循环访问
    if (seen.has(depId)) { // 已经缓存过了
      return
    }
    seen.add(depId) // 没有缓存，添加进 set 中
  }

  if (isA) { // - 数组
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else { // -- 对象
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
    // 遍历对象的所有属性，这里对象中的每个属性都被访问到了
    // 所以会触发每个被访问的 get ，每个属性都会触发 依赖收集 的流程，对性能有所损耗
}
