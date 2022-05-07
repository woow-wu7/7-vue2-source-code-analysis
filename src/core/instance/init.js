/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

// initMixin
export function initMixin (Vue: Class<Component>) {

  // _init
  // Vue.prototype._init
  // new Vue(options) -> this._init(options)
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this

    // 1
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true

    // 2
    // merge options
    // 合并 options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }


    // 3
    // vm._renderProxy
    // _renderProxy 在 render函数中作为render的参数
    // vnode = render.call(vm._renderProxy, vm.$createElement)
     /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {

      initProxy(vm) // ----------------- 开发环境，文件路径：src/core/instance/proxy.js

      // initProxy = function initProxy (vm) {
      //   if (hasProxy) {
      //     // determine which proxy handler to use
      //     const options = vm.$options
      //     const handlers = options.render && options.render._withStripped
      //       ? getHandler
      //       : hasHandler
      //     vm._renderProxy = new Proxy(vm, handlers)
      //   } else {
      //     vm._renderProxy = vm
      //   }
      // }

    } else {
      vm._renderProxy = vm // ---------- 生产环境
    }

    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)


    // initRender
    // initRender 中会声明 vm.$createElement() 方法
    // 初始化render函数，在 初始化mount过程中，会调用 render 方法
    initRender(vm)


    // 1
    // beforeCreate()
    // -------------------------------------- beforeCreate 生命周期钩子函数
    // - vueRouter vueMixin 可以获得
    // - 问题：在 beforeCreate 中是不能获取到 vm 上的属性的，比如data,methods中的属性都不能获取到，但是在 created 中是可以获取到的
    // - 回答：因为 initState 还没有执行，获取不到props，methods，data, computed，watch等属性的
    callHook(vm, 'beforeCreate')

    initInjections(vm) // resolve injections before data/props
    initState(vm) // initState
    initProvide(vm) // resolve provide after data/props

    // 2
    // created()
    // -------------------------------------- created 生命周期钩子函数
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    // 3
    // $mount 初始化挂在的过程
    if (vm.$options.el) {
      vm.$mount(vm.$options.el) // mount 阶段
      // vm.$mount() -> mountComponent() -> updateComponent = () => { vm._update(vm._render(), hydrating)
      // 1
      // vm.$mount() 方法的定义有两个版本，文件位置
      //   - (1) 一个是 runtime+compiler 版本
      //     - 渲染过程：template -> render函数 -> vnode -> 真实的DOM
      //     - 文件位置：src/platforms/web/entry-runtime-with-compiler.js
      //   - (2) 另一个是 runtime 版本
      //     - 渲染过程：render函数 -> vnode -> 真实的DOM
      //     - 特点：打包后的体积比 runtime+compiler 版本的体积 ( 小30%左右 )
      //     - 文件位置：src/platforms/web/runtime/index.js
      // 2
      // mountComponent() 文件位置 -------> src/core/instance/lifecycle.js
      // 3
      // vm._render() 文件位置 -----------> src/core/instance/render.js
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
