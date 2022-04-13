/* @flow */

import { isDef } from "shared/util";
import { isAsyncPlaceholder } from "./is-async-placeholder";

// 1
// isDef
// export function isDef (v: any): boolean %checks {
//   return v !== undefined && v !== null
// }

// isAsyncPlaceholder
// export function isAsyncPlaceholder (node: VNode): boolean {
//   return node.isComment && node.asyncFactory
// }

// getFirstComponentChild
// - 返回第一个组件vnode
// - 注意：是 keep-alive 包裹的 slot 中的第一个 组件vnode
export function getFirstComponentChild(children: ?Array<VNode>): ?VNode {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i]; // 遍历 slot 的 第一层 所有vnode

      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c;
        // 返回 ( 第一个 ) 组件 vnode
        // 因为 return 会直接跳出 for 循环，并作为整个函数的返回值
      }
    }
  }
}
