# vue

### (1) vue 的生命周期

- mount 阶段
  - beforeCreate
  - created
  - beforeMount
  - mounted
- update 阶段
  - beforeUpdate
  - updated
- umMount 阶段
  - beforeUnmount
  - unMount
  - 或者改版之前：beforeDestroy destroyed
- keep-alive 相关
  - activated ------- keepAlive 缓存的组件激活时触发
  - deactivated ----- keepAlive 缓存的组件失活时触发
- 错误相关
  - errorCaptured --- 在捕获一个来自后代组件的错误时被调用

### (2) 父子组件生命周期执行顺序

```
1. mount阶段
父组件-beforeCreate
父组件-created
父组件-beforeMount
子组件-beforeCreate
子组件-created
子组件-beforeMount
子组件-mounted
父组件-mounted


2. update阶段
父组件-beforeUpdate
子组件-beforeUpdate
子组件-updated
父组件-updated


3. unmount阶段
父组件-beforeUnmount
子组件-beforeUnmount
子组件-unmounted
父组件-unmounted
```

### (3) computed

- 特点
  - 1. 只有在 computed 被访问时才会去计算
  - 2. computed 具有缓存功能，也就是说如果之前某个 computed 的 key 被访问过了，再次访问不会进行重新计算，而是直接返回之前计算好的值
  - 3. computed 的依赖必须是响应式数据，不然依赖变化后也不会触发 computed 重新计算
  - 4. 即使 computed 的依赖变化了，但是 computed 计算的值并没有变化时，也不会重新渲染

```
computedWatcher
- this.value=undefined，即不会立即求值
- 问题：那什么时候求值？
- 回答：在 template 中访问到了 computed 定义的计算属性时会进行计算
- 原理：
  - 过程：因为computed初始化时，会在defineComputed()函数中进行Object.defineProperty(target, key, sharedPropertyDefinition)，即get/set依赖收集和派发更新
  - 最终：执行 watcher.evaluate() --> watcher.get() --> watcher.getter.call(vm, vm) --> expOrFn() --> 就是computed对象key对应的方法
- computed的特点
  - 1. computed只有在 ( 被访问时 ) 才会去进行计算，上面已经分析过了
  - 2. computed计算属性具有 ( 缓存功能 )
  - 3. computed的依赖必须是 ( 响应式数据 )，不然依赖更新，也不会重新计算
  - 4. computed的依赖项是响应式数据并且变化了，但是如果 ( 计算的结果不变 )，应用也 ( 不会重新渲染 )
- 相关原理及分析地址
  - https:juejin.cn/post/6844904184035147790
  (1) computed只有在被访问时才会重新计算
    - 因为：在new Watcher是computed watcher时，即lazy=true时，在构造函数中没有立即执行get()方法，而是在计算属性被访问时触发computed的响应式get后，执行的get方法中回去调用computed getter函数
    - 之前：上面已经分析过了
  (2) computed具有缓存功能
    - 表现：表现为如果computed中的key被访问过，下次在访问不会再重新计算，而是直接返回之前计算好的值
    - 原理：
      - dirty=true，进行 watcher.evaluate() 执行computed的key对应的函数得到计算解结果
      - watcher.evaluate() 计算到结果后，又会将 dirty=false
      - 下次再访问到computed的key时，不会重新进行 watcher.evaluate() 的计算，而是直接返回之前计算好的结果，之前的值已经缓存在watcher.value中
```

### (4) watch

- watch 对象的 key 对应的 value 的类型
  - function --- 表示 key 变化时执行的函数
  - string ----- 表示 方法名 或 data.a 对象.b 属性
  - object ----- 对象中一定要有 handler 方法，{ handler, immediate, deep, sync }
  - array ------ 以上的组合
  - 最终都会把不同类型的 handler 转换成函数，然后执行 vm.$watch(expOrFn, handler, options)
  - 官网说明：https:cn.vuejs.org/v2/api/#watch
- watch 对象的 value 是对象时，支持的属性
  - deep：表示深度监听
  - immediate：表示立即执行 callback，不用等到 key 变化时才去执行
  - sync：表示 ( 同步 watch 对象中的 handler 先执行 )，( 普通的 watch 对象的 handler 后执行 )

### (5) nextTick

```
nextTick
---

1. 作用
  - 在下次DOM更新循环结束后，执行延时回调
  - 在修改数据后，立即使用 nextTick 获取 ( 更新后的DOM )
2. 原理
  - 利用从 微任务 到 宏任务 的逐渐降级
  - promise -> mutationObserver -> setImmediate -> setTimeout
  - 扩展
    - 微任务
      - promise
      - process.nextTick
      - mutationObserver
    - 宏任务
      - setTimeout
      - setInterval
      - setImmediate
      - requestAnimationFrame
```

### (6) Object.defineProperty 的缺点

```
Object.defineProperty 的缺点
---

对象
- 问题：添加和删除属性，不会响应式
- 解决：
  - Vue.set()
  - vm.$set()

数组
- 问题
  - 下标修改：通过 数组下标 修改数组成员的值，不会响应式
  - 长度：修改数组长度时，不会响应式
- 解决
  - Vue.set()
  - 利用 vue 重写的 7 中方法
```

### (6) keep-alive 的原理

# 相关链接

- https:github.com/woow-wu7/7-vue2-source-code-analysis/blob/main/src/core/observer/watcher.js
