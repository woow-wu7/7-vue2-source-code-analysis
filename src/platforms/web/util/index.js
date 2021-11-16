/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 */
export function query (el: string | Element): Element {
  // el 是字符串，即css选择器字符串，返回css选择器对应的符合前条件的第一个元素节点
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
      // 条件：el是css选择器字符串时，对应的DOM元素节点不存在
      // 则：开发环境报错，并且创建一个空的div返回
    }
    // el对应的元素节点存在，直接返回css选择器对应的元素节点
    return selected
  } else {

    // el 不是字符串，直接返回el
    return el
  }
}

// 1
// document.querySelector(css选择器字符串)
// 参数
//  - 接受一个 ( css选择器 ) 字符串为参数
//  - css选择器有哪些？
//    - 元素选择器：id class element *
//    - 关系选择器：子选择器>，后代选择器，相邻选择器+，兄弟选择器～
//    - 属性选择器：element[attr=a]
//    - 伪元素选择器
//    - 伪类选择器
// 返回值
//  - 匹配该选择器的 ( 元素节点 )
//  - 如果有多个元素节点满足匹配条件，则返回 ( 第一个 ) 匹配的元素节点
