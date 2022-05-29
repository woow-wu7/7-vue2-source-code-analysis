/* @flow */

import { toNumber, toString, looseEqual, looseIndexOf } from 'shared/util'
import { createTextVNode, createEmptyVNode } from 'core/vdom/vnode'
import { renderList } from './render-list'
import { renderSlot } from './render-slot'
import { resolveFilter } from './resolve-filter'
import { checkKeyCodes } from './check-keycodes'
import { bindObjectProps } from './bind-object-props'
import { renderStatic, markOnce } from './render-static'
import { bindObjectListeners } from './bind-object-listeners'
import { resolveScopedSlots } from './resolve-scoped-slots'
import { bindDynamicKeys, prependModifier } from './bind-dynamic-keys'

// installRenderHelpers
// 参数
//  - target：是 Vue.prototype
export function installRenderHelpers (target: any) {
  target._o = markOnce
  target._n = toNumber
  target._s = toString

  target._l = renderList // renderList

  target._t = renderSlot
  target._q = looseEqual
  target._i = looseIndexOf
  target._m = renderStatic

  target._f = resolveFilter
  // filter相关 -> Vue.prototype._f = function(id: string) { return resolveAsset(this.$options, 'filters', id, true) || identity }

  target._k = checkKeyCodes
  target._b = bindObjectProps
  target._v = createTextVNode

  target._e = createEmptyVNode // 创建空节点
  // export const createEmptyVNode = (text: string = '') => {
  //   const node = new VNode()
  //   node.text = text
  //   node.isComment = true // 是一个没有文本的注释节点
  //   return node
  // }

  target._u = resolveScopedSlots
  target._g = bindObjectListeners
  target._d = bindDynamicKeys
  target._p = prependModifier
}
