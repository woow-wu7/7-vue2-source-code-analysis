/* @flow */

import { identity, resolveAsset } from 'core/util/index'

// identity
/**
 * Return the same value.
 * 直接返回参数
 * identity 有一致的意思
 */
//  export const identity = (_: any) => _


/**
 * Runtime helper for resolving filters
 */
export function resolveFilter (id: string): Function {
  return resolveAsset(this.$options, 'filters', id, true) || identity
  // resolveAsset 函数主要用来处理 Vue 实例内部的 directives、 components 、filters
}
