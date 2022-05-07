import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// 大 Vue 就是一个构造函数
// - 思考：为什么不使用class，而是使用 构造函数？
// - 因为vue可以把不同的方法挂载原型链上，把实现代码单独抽离成文件，方便管理
// - 而class的话，所有非静态属性(原型属性)都必须在class内部声明，不利于大型工程文件管理

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
    // Vue是构造函数，需要通过new来调用
  }
  // vue原型上的 _init 方法，被vue实例所继承，所以可以访问到
  this._init(options) // ---------- _init方法在什么地方定义的？ initMixin(Vue) 中
}

initMixin(Vue) // ------------------ 在该函数中声明了 _init 方法
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue) // filter 在 renderMixin() -> installRenderHelpers() 中初始化

export default Vue
