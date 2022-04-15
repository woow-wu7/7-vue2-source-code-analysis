/* @flow */

import { toArray } from "../util/index";

// ----------------------------------------------
// Vue.use()
export function initUse(Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {

    // 1
    // 每个 Vue 的 plugin
    // - 1. 是对象时都具有一个install方法
    // - 2. 是函数时本身会被当作install方法

    // 2
    // install(Vue [, options])
    // - 第一个参数：是大Vue
    //  - 所以：具有Vue的能力
    //  - 比如：Vue.directive指令，Vue.mixin混合，Vue.prototype.xxx原型属性方法，Vue.xxx静态属性和方法

    const installedPlugins = this._installedPlugins || (this._installedPlugins = []); // 不存在赋值空数组

    // ------------ 插件已经注册过
    if (installedPlugins.indexOf(plugin) > -1) {
      // 如果已经注册过该插件，返回this
      // this表示大Vue，返回this，表示不再往下执行，同时可以实现链式调用，Vue.use().use()
      return this;
    }

    // ----------- 插件未注册过，继续往下执行
    // additional parameters 附加参数
    // - Vue.use(plugin, additionalParameters) 附加的可选的第二个配置项对象参数
    const args = toArray(arguments, 1);
    // args
    // - 注意这里的 arguments 是 Vue.use()方法中的 arguments
    // - 这里表示：获取 Vue.use() 的第二个参数 options 对象

    // toArray()
    // export function toArray (list: any, start?: number): Array<any> {
    //   start = start || 0
    //   let i = list.length - start
    //   const ret: Array<any> = new Array(i)
    //   while (i--) {
    //     ret[i] = list[i + start] // 这里写的很精妙
    //   }
    //   return ret
    // }

    args.unshift(this);
    // 将大 Vue 添加进参数数组最前面，这样调用plugin的install方法的第一个参数就变成了Vue

    if (typeof plugin.install === "function") {
      // 插件是对象，install方法存在并且是function，调用
      // 注意：vue的plugin中的install方法的第一个参数：大Vue，就是args数组的第一个成员就是大Vue， args.unshift(this);
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === "function") {
      // 插件本身是函数，调用
      plugin.apply(null, args);
    }

    installedPlugins.push(plugin); // 未注册过该插件，调用插件后，把该插件添加进插件数组，用于之后判断是否注册过该插件

    return this; // 同样的，插件 注册过 和 未注册过 都在最后返回 Vue，实现Vue.use() 的链式调用
  };
}
