/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1


  /**
   * Class inheritance
   * 继承 Class
   */
  // Vue.extend()
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    const Super = this  // this指的是Vue
    const SuperId = Super.cid // SuperId => cid，是构造函数的唯一表示

    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    // cachedCtors
    // - 用来缓存 Constructor
    // - 参数对象中不存在 _Ctor 属性，就将 cachedCtors = extendOptions._Ctor = {} 赋值为空对象

    // 1. 有缓存，直接返回
    if (cachedCtors[SuperId]) {
      // 存在缓存，直接返回
      return cachedCtors[SuperId]
    }

    // 2. 没有缓存，继续往下执行
    const name = extendOptions.name || Super.options.name
    // name
    // - 参数对象中不存在 name 属性，就是用父类的options的name属性

    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
        // validateComponentName() 验证 name 的合法性
        // - 1.不能是 slot component 这样的内置标签名
        // - 2.不能是 HTML5 的保留关键字标签
    }

    const Sub = function VueComponent (options) { // 定义子类
      this._init(options)
    }
    Sub.prototype = Object.create(Super.prototype)     // 将 ( 子类的原型 ) 指向 ( 父类原型的实例子 ) ---> 子类实力就能继承父类实例，以及父类实力原型上的属性和方法
    Sub.prototype.constructor = Sub
    // 重新改变子类原型的 constructor 的指向，防止引用出错
    // 将原型上的constructor属性指向自己，防止修改了原型后 prototype.constructor 不再是指向 Sub


    Sub.cid = cid++
    Sub.options = mergeOptions(  // 合并options => 将父类的options和参数对象合并
      Super.options,
      extendOptions
    )

    Sub['super'] = Super  // 在子类上挂载 super 属性，指向父类；即子类中包含了父类的引用

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    // 在扩展的时候定义getters来扩展props和computed，避免在创建实例的时候通过Object.defineProperty调用
    if (Sub.options.props) {
      initProps(Sub)
      // 初始化 子类 的props
      // props属性存在，就将props做一层代理
      // initProps方法可以让用户访问this[propName]时相当于访问this._props[propName]
    }
    if (Sub.options.computed) {
      initComputed(Sub)
      // 同上
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use
    // 继承相关属性

    // create asset registers, so extended classes
    // can have their private assets too.
    // export const ASSET_TYPES = [
    //   'component',
    //   'directive',
    //   'filter'
    // ]
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type] // 拷贝 Super 上的 component，directive，filter 属性
    })
    // enable recursive self-lookup
    // 启用递归自查找
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    // 缓存 Sub
    cachedCtors[SuperId] = Sub

    return Sub
    // 返回 Sub
    // 其实就是通过拷贝赋值的方式创建子类
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
