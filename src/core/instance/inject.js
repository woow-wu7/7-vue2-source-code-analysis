/* @flow */

import { hasOwn } from "shared/util";
import { warn, hasSymbol } from "../util/index";
import { defineReactive, toggleObserving } from "../observer/index";

// provide 初始化
// - 不保证响应式：provide 和 inject 并不保证响应式
// - 解决响应式: 可以使用 computed 进行包装
// - 官网说明: https://cn.vuejs.org/guide/components/provide-inject.html#working-with-reactivity
export function initProvide(vm: Component) {
  const provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === "function" ? provide.call(vm) : provide;
    // provide 支持 function 和 object 两种写法
    // 类比于 data 的两种声明
  }
}

// inject 初始化
export function initInjections(vm: Component) {
  const result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false);
    Object.keys(result).forEach((key) => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== "production") {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
              `overwritten whenever the provided component re-renders. ` +
              `injection being mutated: "${key}"`,
            vm
          );
        });
      } else {
        defineReactive(vm, key, result[key]);
      }
    });
    toggleObserving(true);
  }
}

export function resolveInject(inject: any, vm: Component): ?Object {
  if (inject) {
    // 如果 vm.$options.inject 存在
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null);
    const keys = hasSymbol ? Reflect.ownKeys(inject) : Object.keys(inject); // 遍历 inject 对象上的 key

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // #6574 in case the inject object is observed...
      if (key === "__ob__") continue;
      const provideKey = inject[key].from;
      let source = vm;
      while (source) {
        // 1
        // 存在
        // - inject 中的 key 在 provide 中存在
        // - 就回去 provide key 对应的值，放入result对象
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break;
        }

        // 2
        // 不存在
        // - inject 中的 key 在 provide 中存在
        // - 就不断向上寻找，直到vm不存在，或者找到
        source = source.$parent;
      }

      // 一直没找到，就用默认值
      if (!source) {
        if ("default" in inject[key]) {
          const provideDefault = inject[key].default;
          result[key] =
            typeof provideDefault === "function"
              ? provideDefault.call(vm)
              : provideDefault;
        } else if (process.env.NODE_ENV !== "production") {
          warn(`Injection "${key}" not found`, vm);
        }
      }
    }

    // 返回找到的值
    return result;

    // 原理总结:
    // - 在初始化阶段，Vue 会遍历当前组件 inject 选项中的所有键名，拿这个键名在上级组件中的 _provided 属性里面进行查找
    //  - 如果找到了 - 就使用对应的值
    //  - 如果找不到 - 则再向上一级查找，直到查找完根组件为止，最终如果没有找到则使用默认值，通过这样层层向上查找的方式最终实现 provide 和 inject 的数据传递机制
  }
}
