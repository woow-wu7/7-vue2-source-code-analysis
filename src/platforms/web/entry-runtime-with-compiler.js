/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// runtime + compiler 版本
const mount = Vue.prototype.$mount
// mount
// - 这里缓存了在 runtime版本的上的  Vue.prototype.$mount，Vue是从 ‘./runtime/index’ 中引入的
// - 缓存之后，又重写了 Vue.prototype.$mount，这样就做了备份

Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)
  // query(el) 的作用就是根据el的不同情况，返回对应的元素节点

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    // 开发环境，el最终对应的元素节点不能是 html 或者 body，不然会被覆盖
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) { // render函数不存在
    // render方法不存在
    let template = options.template
    if (template) {
      if (typeof template === 'string') { // ---------------------------------- template是字符串
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          // const idToTemplate = cached(id => {
          //   const el = query(id)
          //   return el && el.innerHTML
          // })
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) { // ----------------------------------- template是一个节点
        // template是一个节点
        // template.nodeType 返回一个数字，表示节点类型
        // Node.nodeType

        // 扩展
        // Node.nodeType
        // - 作用
        //  - 返回一个 ( 整数值 )，表示 ( 节点的类型 )
        // - 具体
        //  - document 文档节点 ------------------ 9
        //  - element 元素节点 ------------- 1
        //  - attr 属性节点 ---------------- 2
        //  - text 文本节点 ---------------- 3
        //  - DocumentFragment 文档片段节点 ------ 11
        //  - DocumentType 文档类型节点 ---------- 10
        //  - Comment 注释节点 ------------------- 8

        template = template.innerHTML // 获取html
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) { // --------------------------------------------------- template不存在，但 el 存在
      template = getOuterHTML(el)
      // function getOuterHTML (el: Element): string {
      //   if (el.outerHTML) {
      //     return el.outerHTML
      //   } else {
      //     包装一层div，将el作为最后一个孩子，返回div.innerHTML
      //     const container = document.createElement('div')
      //     container.appendChild(el.cloneNode(true))
      //     return container.innerHTML
      //   }
      // }
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      // compileToFunctions()
      // - 将模版编译成 render 函数
      // - 如果是runtime+compiler版本(即传入new Vue()的参数对象中不存在render方法)
      //  - 1. 就会先处理template
      //    - 将 template 通过 compileToFunctions(template, options) 函数编译成 ( render ) 函数
      //  - 2. render函数【】【】
      //    - render函数的主要作用：把 template｜el 转换成 vnode
      //  - 3. 然后调用 mount.call(this, el, hydrating) 即 mountComponent(this, el, hydrating) 方法
      //    - vm._render() 函数会作为 vm._update() 函数的参数 --> 触发 watcher.update() 方法
      //    - mountComponent函数的文件位置：src/core/instance/lifecycle.js
      //  - 4. update函数【】【】
      //    - 负责把 ( vnode ) 挂载到 ( 真实的DOM上 )

      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
   // 调用上面缓存的 mount 方法
   // - 具体文件路径：'./runtime/index'
    // mount 中会调用  mountComponent(this, el, hydrating)
    // mount = Vue.prototype.$mount = function (
    //   el?: string | Element,
    //   hydrating?: boolean
    // ): Component {
    //   el = el && inBrowser ? query(el) : undefined
    //   return mountComponent(this, el, hydrating)
    // }
   // 这里执行 mount 方法时，还会再次执行 query(el) 方法，多了一次，只是runtime版本考虑的
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
