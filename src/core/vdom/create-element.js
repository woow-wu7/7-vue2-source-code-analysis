/* @flow */

import config from '../config'
import VNode, { createEmptyVNode } from './vnode'
import { createComponent } from './create-component'
import { traverse } from '../observer/traverse'

import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isObject,
  isPrimitive, // primitive 是原始的，落后的意思
  resolveAsset
} from '../util/index'

import {
  normalizeChildren,
  simpleNormalizeChildren
} from './helpers/index'

const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

// createElement
// wrapper function for providing a more flexible interface
// without getting yelled at by flow
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
// - createElement的一些使用方式
//    - 1. createElement('div', 'text1text2') 中的第二个参数会作为 这里的第三个参数(源码中的第四个参数) children来处理
//    - 2. createElement('div', [createElement()]) 中的第二个参数会作为 这里第三个参数(源码中的第四个参数) children来处理
//    - 3. createElement('div', {class, style, ...}, 'text1')
//    - 4. createElement({data, props, ...}, 'text')
//    - ...

/**
 * isPrimitive
 *  - Check if value is primitive.
 *    - number string boolean symbol
 *    - undefined null ？
*/
// export function isPrimitive (value: any): boolean %checks {
//  return (
//    typeof value === 'string' ||
//    typeof value === 'number' ||
//    // $flow-disable-line
//    typeof value === 'symbol' ||
//    typeof value === 'boolean'
//  )
// }
export function createElement (
  context: Component,
  tag: any, // String | Object | Function
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) { // data 是 数组 或者 原始值
    normalizationType = children // 第五个参数 换成 第四个参数
    children = data // 第四个参数 换成 第三个参数
    data = undefined // 第三个参数 换成 undefined

    // 也就是说：当我们使用render(createElement)
    //  - 1. createElement('div', 'text1text2') 中的第二个参数会作为 这里的第三个参数(源码中的第四个参数) children来处理
    //  - 2. createElement('div', [createElement()]) 中的第二个参数会作为 这里第三个参数(源码中的第四个参数) children来处理
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  if (isDef(data) && isDef((data: any).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode()
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    if (!__WEEX__ || !('@binding' in data.key)) {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      )
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }

  // simpleNormalizeChildren
  //  - 将第三个参数(只有两个参数时的第二个参数)做一层 normalize，将两层嵌套的数组拍平为一层的数组
  //  - [father1, [child1, child2], father2] -> [father1, child1, child2, father2]
  // normalizeChildren
  //  - 不只是拍平一层，是多层
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }

  let vnode, ns
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    if (config.isReservedTag(tag)) { // vue中的保留字段
      // platform built-in elements
      if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn) && data.tag !== 'component') {
        warn(
          `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
          context
        )
      }
      vnode = new VNode( // 生成VNode
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children)
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns)
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS (vnode, ns, force) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined
    force = true
  }
  if (isDef(vnode.children)) {
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i]
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force)
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings (data) {
  if (isObject(data.style)) {
    traverse(data.style)
  }
  if (isObject(data.class)) {
    traverse(data.class)
  }
}
