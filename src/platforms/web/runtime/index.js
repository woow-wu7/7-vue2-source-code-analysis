/* @flow */

import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser } from 'core/util/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from 'web/util/index'

import { patch } from './patch'
import platformDirectives from './directives/index'
import platformComponents from './components/index'

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop

// runtime 版本
// public mount method

// 扩展
// ( runtime版本 ) 和 ( runtime+compiler版本 ) 有什么区别 ？
// - runtime版本：------------- 直接使用render函数，不能使用template
// - runtime+compiler版本：---- 会在运行时，将 template 编译成 render 函数

Vue.prototype.$mount = function (
  el?: string | Element, // el可能是字符串，表示css选择器；也可能是一个元素节点
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  // query(el) 的作用就是根据el的不同情况，返回对应的元素节点

  return mountComponent(this, el, hydrating)
  // mountComponent
  // 文件位置 src/core/instance/lifecycle.js
}
// 1
// inBrowser
// const inBrowser = typeof window !== 'undefined'

// 2
// query()
// export function query (el: string | Element): Element {
//   if (typeof el === 'string') {
//     const selected = document.querySelector(el)
//     if (!selected) {
//       process.env.NODE_ENV !== 'production' && warn(
//         'Cannot find element: ' + el
//       )
//       return document.createElement('div')
//     }
//     return selected
//   } else {
//     return el
//   }
// }

// devtools global hook
/* istanbul ignore next */
if (inBrowser) {
  setTimeout(() => {
    if (config.devtools) {
      if (devtools) {
        devtools.emit('init', Vue)
      } else if (
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test'
      ) {
        console[console.info ? 'info' : 'log'](
          'Download the Vue Devtools extension for a better development experience:\n' +
          'https://github.com/vuejs/vue-devtools'
        )
      }
    }
    if (process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      config.productionTip !== false &&
      typeof console !== 'undefined'
    ) {
      console[console.info ? 'info' : 'log'](
        `You are running Vue in development mode.\n` +
        `Make sure to turn on production mode when deploying for production.\n` +
        `See more tips at https://vuejs.org/guide/deployment.html`
      )
    }
  }, 0)
}

export default Vue
