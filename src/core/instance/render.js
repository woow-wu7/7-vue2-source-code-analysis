/* @flow */

import {
  warn,
  nextTick,
  emptyObject,
  handleError,
  defineReactive
} from '../util/index'

import { createElement } from '../vdom/create-element'
import { installRenderHelpers } from './render-helpers/index'
import { resolveSlots } from './render-helpers/resolve-slots'
import { normalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import VNode, { createEmptyVNode } from '../vdom/vnode'

import { isUpdatingChildComponent } from './lifecycle'

// initRender函数执行是在 init 的过程中
// 1
// render()
// - render函数签名：(createElement: () => VNode) => VNode
// 2
// createElement()
// 1. 返回值
//  - createElement() 返回一个VNode
// 2. 参数
//    - 第一个参数：
//      - {String | Object | Function}
//      - HTML标签名、组件选项对象(其实就是一个组件)，或者 resolve 了上述任何一种的一个 async 函数。必填项。
//    - 第二个参数
//      - {Object}
//      - 一个与模板中 attribute 对应的数据对象。可选。
//      - 第二个参数其实就是数据对象，官网链接  https://cn.vuejs.org/v2/guide/render-function.html#createElement-%E5%8F%82%E6%95%B0
//      - 从官网中我们需要学习到
//        - 1. render和template相比的好处
//        - 2. 第二个参数-即数据对象的属性有哪些，比如 class，style，attrs，props，domProps，on，nativeOn，directives，scopedSlots，slot，key，ref，refInFor
//        - 3. render()方法中的一些约束
//    - 第三个参数
//      - {String | Array}
//      - 子级虚拟节点 (VNodes)，由 `crateElement()` 构建而成，也可以使用字符串来生成“文本虚拟节点”。可选
// - 参数注意点
//  - 第二个和点三个参数是可选的
//  - 当只有两个参数时，第二个参数会被当作第三个参数来处理

// 3
// 流程
// initRender -> createElement() -> _createElement(context, tag, data, children, normalizationType)
export function initRender (vm: Component) {
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null // v-once cached trees
  const options = vm.$options
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates

  // createElement文件位置 --> src/core/vdom/create-element.js
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false) // ------------- template模版编译时使用

  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true) // - 手写render函数时使用
  // 1
  // vm._c ----------------------> template编译时使用
  // vm.$createElement ----------> 手写render时编译时使用

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
    }, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, () => {
      !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
    }, true)
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true)
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  }
}

export let currentRenderingInstance: Component | null = null

// for testing only
export function setCurrentRenderingInstance (vm: Component) {
  currentRenderingInstance = vm
}

export function renderMixin (Vue: Class<Component>) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype)

  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }


  // render 方法
  // _render() ----------------------------------------------------------------------
  // - render 方法返回的是一个 vnode
  // - virtualDOM -> virtual 是虚拟的意思
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    const { render, _parentVnode } = vm.$options

    if (_parentVnode) {
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      )
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      // There's no need to maintain a stack because all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm

      // 生成vnode
      // 1
      // vm.$createElement
      // - vm.$createElement 在 initRender 中定义的
      // - vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
      // - 文件路径：
      //    - 1. 本文件中，initRender() 函数中声明了 vm.$createElement
      //    - 2. 而 initRender 执行是在 new Vue() -> this._init() 方法中调用的
      // 2
      // vm.$createElement -> createElement
      // - createElement方法的文件路径：src/core/vdom/create-element.js
      // 3
      // vm._renderProxy
      // - 生产环境：vm._renderProxy 是 vm
      // - 开发环境：vm._renderProxy 可能是一个 proxy 对象，即 initProxy(vm)
      // - if (process.env.NODE_ENV !== 'production') { initProxy(vm) } else { vm._renderProxy = vm }
      // - 具体在：src/core/instance/init.js 中
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      handleError(e, vm, `render`)
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
        } catch (e) {
          handleError(e, vm, `renderError`)
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    } finally {
      currentRenderingInstance = null
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0]
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }
}
