/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'


// 1
// cached
// export function cached<F: Function> (fn: F): F {
//   const cache = Object.create(null)
//   return (function cachedFn (str: string) {
//     const hit = cache[str]
//     return hit || (cache[str] = fn(str))
//     // 1. 第一层函数：cached(fn)
//     // 2. 第二次函数 cachedFn(str)
//     // 整个逻辑表示：
//     //  - 如果 cache缓存对象中 str 存在，就直接返回 ---- 其实 cache[str]是一个函数，因为初始时不存在会执行 cache[str] = fn(str)
//     // 最终的功能
//     //  - 就是缓存函数参数，如果参数之前传过，会返回之前该参数计算的结果值
//   }: any)
// }
// - cached(fn) 执行后返回的是一个函数，即 idToTemplate 是一个函数
// - idToTemplate(str) 函数的参数是一个字符串

// 2
// idToTemplate
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})



// $mount ------------------------------------------------------------------------------------
// mount 阶段
// - runtime + compiler 版本
// - 1. 作用：mount变量 -> 这里缓存了在 ( runtime版本的上的 )
// - 2. 文件路径：Vue.prototype.$mount ->  ‘src/platforms/web/runtime/index.js’ 中引入的
// - 3. 引入：通过 import Vue from './runtime/index' 引入Vue，而该文件中就在 Vue.prototype 上声明了 $mount 方法
// - 4. 总结：缓存之后，又重写了 Vue.prototype.$mount，这样就做了 mount 备份，重写后能拿到缓存的mount
const mount = Vue.prototype.$mount

Vue.prototype.$mount = function (
  el?: string | Element, // 在初始化时，传入el是string ---> vm.$mount(vm.$options.el) -> new Vue({ el: "#app", })
  hydrating?: boolean
): Component {

  el = el && query(el)
  // query(el)
  // - 作用：就是根据el的不同情况，返回对应的 ( 元素节点 )
  // - 文件路径： './util/index'

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

    // 扩展
    // - vue中 template 模版的 4 种写法
    // - 链接：https://blog.csdn.net/a460550542/article/details/122063298
    // - 测试：当前项目的根目录/index-test.html
    // - 详情：2022-05-06.md

    let template = options.template
    if (template) {
      if (typeof template === 'string') { // ---------------------- template是字符串
        if (template.charAt(0) === '#') {
          // template是字符串，并且new Vue({template: '#xx'})是一个id选择器
          // es6中增加了 string.at() 作用和 string.charAt() 类似
          // template字符串以#开头，说明是一个 id 选择器
          // 详情：2022-05-06.md

          template = idToTemplate(template)
          // const idToTemplate = cached(id => {
          //   const el = query(id)
          //   return el && el.innerHTML
          // })
          // - idToTemplate(template) 中的参数 template 表示的就是 id，该id作为 cached(fn) 的 fn的参数


          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) { // -------------------------- template是一个节点，即一个DOM对象
        // template是一个节点
        // template.nodeType 返回一个数字，表示节点类型
        // Node.nodeType

        // 扩展
        // Node.nodeType
        // - 作用
        //  - 返回一个 ( 整数值 )，表示 ( 节点的类型 )
        // - 具体
        //  - element 元素节点 ------------- 1
        //  - attr 属性节点 ---------------- 2
        //  - text 文本节点 ---------------- 3
        //  - DocumentFragment 文档片段节点 ------ 11
        //  - DocumentType 文档类型节点 ---------- 10
        //  - document 文档节点 ------------------ 9
        //  - Comment 注释节点 ------------------- 8

        template = template.innerHTML // 获取 DOM对象的 innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) { // ------------------------------------------- template不存在，但 el 存在
      template = getOuterHTML(el)
      // 1
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

      // 2
      // Element.outerHTML
      // - 返回一个字符串，表示当前元素节点的所有 HTML 代码，包括该元素本身和所有子元素
      // - 比 innerHTML 多了 元素自身
      // - 例子
      // HTML 代码如下
      // <div id="d"><p>Hello</p></div>
      // var d = document.getElementById('d');
      // d.outerHTML
      // '<div id="d"><p>Hello</p></div>'
    }


    // 上面的过程做了以下处理
    // - 1. template存在
    // - 2. template不存在，但是el存在，将el选择器对应的DOM赋值给 template
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


      // 最终 template 都会被传入 compileToFunctions 函数中
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

  return mount.call(this, el, hydrating) // 这里的el是id选择器对应的DOM
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
