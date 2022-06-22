# vue

### (1) vue 的生命周期

- mount 阶段
  - beforeCreate
  - created ----------- 实例创建完成，但是并没有挂载，可以获取 computed，watch，methods等，但是不能获取 $el，$refs
  - beforeMount
  - mounted ----------- 实例被挂在后调用，( 不保证所有子组件也被挂在完成，需要在视图全部更新后执行操作，使用 vm.$nextTick，详细测试见 test-vue/life-cycle/life-cycle.html )
- update 阶段
  - beforeUpdate
  - updated
- umMount 阶段
  - beforeUnmount 3.0
  - unmounted 3.0
  - 或者改版之前的2.0：beforeDestroy destroyed
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
父组件-beforeUnmount/beforeDestroy
子组件-beforeUnmount/beforeDestroy
子组件-unmounted/destroyed
父组件-unmounted/destroyed


问题：为什么创建的时候是父组件先创建，挂载的时候是子组件先挂载
回答：<Father><Child><Child><Father> 可以类比于 ( 函数调用栈 ) 的情况，执行完child出栈，father才会执行完毕出栈
```


### (3) computed

- 特点 ( 4个特点 )
  - 1. 只有在 computed 被访问时才会去计算，( 比如在template模版中被访问，methods中被访问 )
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
  - string ----- 表示 ( 方法名 ) 或 ('a.b') -> data.a 对象 .b 属性
  - object ----- 对象中一定要有 handler 方法，{ handler, immediate, deep, sync }
  - array ------ 以上的组合
  - 最终都会把不同类型的 handler 转换成函数，然后执行 vm.$watch(expOrFn, handler, options)
  - 官网说明：https:cn.vuejs.org/v2/api/#watch
- watch 对象的 value 是对象时，支持的属性
  - handler: watch 的回调函数，参数是 newValue, oldValue
  - deep：表示深度监听
  - immediate：表示立即执行 callback，不用等到 key 变化时才去执行
  - sync：表示 ( 同步 watch 对象中的 handler 先执行 )，( 普通的 watch 对象的 handler 后执行 )

### (5) nextTick

```
nextTick
- this.$nextTick()
- Vue.nextTick()
---

1. 作用
  - 在下次DOM更新循环结束后，执行延时回调
  - 在 ( 修改数据 ) 后，立即使用 nextTick 获取 ( 更新后的DOM )
2. 原理
  - 利用从 微任务 到 宏任务 的逐渐降级
  - promise -> mutationObserver -> setImmediate -> setTimeout
  - 扩展
    - 微任务
      - promise
      - process.nextTick
      - mutationObserver - 观察DOM节点的变化
    - 宏任务
      - setTimeout
      - setInterval
      - setImmediate
      - requestAnimationFrame
3. 使用
  - 1. 传入参数回调，在参数回调中获取最新的DOM ------------ 参数回调
  - 2. 返回一个promise，可以通过then的方式获取最新的DOM --- promise
  - Vue.nextTick(function () { // DOM 更新了 })
  - Vue.nextTick().then(function () { // DOM 更新了 })
4. 案列
  - https://github.com/woow-wu7/vue2-research/blob/master/src/views/Loading.vue
```

### (6) Object.defineProperty 的缺点

```
Object.defineProperty 的缺点
---

对象
- 问题：添加和删除属性，不会响应式，只会在修改属性时才会响应式
- 解决：
  - Vue.set()
  - vm.$set()

数组
- 问题
  - 下标修改：通过 数组下标 修改数组成员的值，不会响应式
  - 长度：修改数组长度时，不会响应式
- 解决
  - Vue.set()
  - 利用 vue 重写的 7 种数组方法
    - push pop unshift shift splice
    - sort reverse
```

### (6) keep-alive 的原理

- keep-alive 是内置的 ( 抽象组件 )
- 抽象组件的特点：( 2个特点 )
  - 1. 自身不会渲染成 DOM 元素，即不占据 DOM 元素
  - 2. 不在父组件链中，即抽象组件的 ( 父组件 ) 和 ( 子组件 ) 直接形成父子关系
- props
  - include
  - exclude
  - max
- 生命周期
  - activated
  - deactivated
- 缓存策略
  - LRU
  - latest recently used 最近最少使用
- 源码
  - src/core/components/keep-alive.js

### (7) diff算法
- 分类：treeDiff componentDiff elementDiff
- 总体：逐层比较，深度优先遍历
  - 1. 节点是组件，走 componentDiff
        - 判断组件类型是否一样，根据组件名称和组件类型判断
          - 类型一样，按原策略逐层比较
          - 类型不一样，脏组件，暴力删除
  - 2. 节点是元素节点，走 elementDiff
        - 添加，删除，移动
  - 3. 具体比较细节
        - 判断 newVnode 和 oldVnode 是否是 ( 同一个虚拟节点 )，即( key和css选择器都要相同 )
          - 不是同一个虚拟节点 ---> 暴力插入新节点，删除旧节点
          - 是同一个虚拟节点
          - (1) 判断 newVnode 和 oldVnode 是否是同一个 ( 内存中的对象 )
              - 是 ---> 不做任何操作
              - 不是 -> 继续往下执行(2)
          - (2) newVnode 和 oldVnode 都只有 text属性
              - text相同 ---> 不做任何操作
              - text不相同 -> 直接修改DOM为newVnode的text
          - (3) newVnode只有children，oldVnode只有text
              - 1. 将 newVnode 的  children 插入到 oldVnode 对应的真实DOM的 前面
              - 2. 同时 删除 oldVnode 对应的 DOM 中的 text
          - (4) newVnode 和 oldVnode 都有 children
              - 四个指针 + 递归
              - 1. 新前与旧前比较 -----> 命中指针后移，按上面的策略进行patch，没命中往下走，执行(2)
              - 2. 新后与旧后比较 -----> 命中指针前移，按上面的策略进行patch，没命中往下走，执行(3)
              - 3. 新后与旧前比较 -----> 命中-旧前指针后移动，新后指针前移，需要移动节点，把 ( 新前 ) 移动到 ( 旧后之后 )；没命中往下走，执行(4)
              - 4. 新前与旧后比较 -----> 命中-新前指针后移，旧后指针前移，需要移动节点，把 ( 新前 ) 移动到 ( 旧前之前 )
              - 指针：前往后移，后往前移

### (8) 用 index 作为 key 的缺点
- key的作用：用于 diff 算法中的唯一标记
- index作用为key的缺点：
  - 描述：比如当渲染list为3个input框，在每个input框中输入123，删除2，3的input框会变成2
  - 原因：因为删除2后，原来3的index变成了2，(key) 和 (css选择器input) 都没变，认为还是之前的2
- 总结
  - 在 静态列表 中，可以使用index作为key
  - 再 动态列表 中，不能使用index作为key，原因如上
- vue：本项目/test-vue/key/test-key.html
- react：https://juejin.cn/post/7029703494877577246

### (9) vue style 标签中的 scoped 的作用
- scoped
  - 是 html5 新增加的属性
  - 是一个 boolean 值，表示 ( 则样式仅仅应用到 style 元素的 - 父元素及其子元素 )
- vue 中的 scoped
  - 作用：样式只作用于该组件，和其他组件即使是同一个class类名，也互不影响
  - 原理：
    - 通过给元素节点添加唯一的属性，然后通过css属性选择器选中该节点
    - 1. 在 html 的css选择器对应的标签节点中，添加自定义属性 ( data-v-hash值 )
    - 2. 在 css选择器 - 添加 ( 属性选择器 ) - ( a[data-v-hash值] )
- 案例
```
<template>
  <div class="loading">
</template>
<style scoped>
  .loading {
    border: 2px solid blue;
  }
</style>


1. html处理为
- 添加自定义属性 data-v-hash值
<div data-v-ffa58c1c class="loading">

2. css处理为
- 属性选择器 loading[data-v-hash值]
loading[data-v-ffa58c1c] {
  border: 2px solid blue;
}
```

### (10) vue2 中 v-if 和 v-for 的优先级
- `注意：在vue3中修改了优先级顺序，v-if > v-for 了，所以在vue3中可以把 v-if 和 v-for 写在一起了`，
- ( v-if,v-for ) 指令的处理发生在 ( 模版编译阶段 )
- 优先级：当 v-if和v-for一起使用时，优先级 ( v-for > v-if )
- 原因
  - 因为
    - 在源码中，在进行if判断的时候，v-for是比v-if先进行判断的
    - 文件位置：src/compiler/codegen/index.js
  - ( 模版template ) 最终会被编译为 ( render函数 )
    - v-for 在编译时会被编译成 ( _l 函数 )，即 renderList 方法
    - v-if 在编译时会被编译成 ( 三元表达式 )；不命中的情况会创建一个空的vnode即 ( 没有文本的注释节点 )
- 具体被编译结果如下
```
1. template
<div>
	<div v-for="value in [1,2]" v-if="true"></div>
</div>


2. 编译结果
- 先v-for生成每个节点，在通过v-if进行判断
function render() {
  with(this) {
    return _c('div', _l(([1, 2]), function (value) {
      return (true) ? _c('div') : _e()
    }), 0)
  }
}

3. 编译网站
https://v2.template-explorer.vuejs.org/

4. 扩展
v-if 和 v-show 的区别
v-if ---> 编译阶段，控制是否渲染
v-show -> 运行时阶段，控制样式，相当于该元素 ( 默认的display ) 和 ( display:none ) 之间切换
```
- 避免：避免在同一元素上同时使用v-for和v-if
- 解决：
  - 1. 如果是对列表进行过滤，可以使用 ( 计算属性 ) 将要渲染的节点过滤后，在交给 ( v-for ) 去渲染
  - 2. 如果是安条件渲染，可以将 ( v-if 提高到容器元素上 )，在容器元素内部再使用 ( v-for )
  - 官网：https://cn.vuejs.org/v2/style-guide/#%E9%81%BF%E5%85%8D-v-if-%E5%92%8C-v-for-%E7%94%A8%E5%9C%A8%E4%B8%80%E8%B5%B7%E5%BF%85%E8%A6%81
- 资料
  - https://juejin.cn/post/6844904183619944462
  - https://juejin.cn/post/6941995130144587789
- v-for
  - 可以遍历 ( 数组，对象，字符串，数字, Iterate接口的数据 )
  - Array | Object | number | string | Iterable (2.6 新增)
  - v-for源码位置：本项目/src/core/instance/render-helpers/render-list.js
- 案例
  - 本项目/test-vue/v-if+v-show/vIf-vShow.html


### (11) template -> render 编译的过程
- 模版编译分为三个阶段：parse解析阶段，优化阶段，代码生成阶段
- 1. parse
  - 解析阶段
  - 将 template 转成 AST
  - 通过 ( 栈 ) 来保证 ( 树形结构 )
- 2. optimize
  - 优化阶段
  - 对 ( 静态节点 和 静态根节点 ) 做优化
    - 问题：什么是静态节点和静态根节点？
    - 回答：
      - 静态节点：有一种节点，在首次渲染后，无论状态怎么改变，它都不会变的节点叫 ( 静态节点 )
      - 静态根节点：就是所有的节点都是静态节点的父节点
    - 如何识别：如果一个dom元素标签中，只含有纯文本，而不含任何变量，即为 ( 静态节点 )
  - 如何优化
    - 整个过程：template(HTML) -> AST -> render -> Vnode -> patch ( diff对比+生成真实DOM )
    - 具体优化：
      - 因为 ( 静态节点和静态根节 ) 点不会变化，所以是 ( 不需要做diff算法比对 ) 的，所以不做diff，提升性能
      - 具体就是两点
        - 1. 在AST中找出所有静态节点并打上标记；
        - 2. 在AST中找出所有静态根节点并打上标记；
  - 扩展
    - 问题：react中有shouldComponentUpdate，为什么vue中不需要
    - 回答：
      - 因为vue是基于模版，即在模版编译阶段就知道哪些节点不需要做diff算法比对，因为只有静态节点和静态根节点可以判断处理
      - 即模版编译节点的 optimize 阶段要做的事情
- 3. generate
  - 代码生成阶段
  - 主要做的事情：生成 render 函数，供组件在挂载时调用
  - render函数有几种？两种
    - 一种是：手写render函数时，直接调用手写的render
    - 另一种：如果没有手写的render，就会把template编译成render
  - 具体过程
    - 递归
    - 从顶向下依次递归AST中的每一个节点，根据 ( 不同的AST节点类型 ) 创建 ( 不同的VNode类型 )


### (12) 事件修饰符的原理
- 常见的事件修饰符
  - stop ---------- 阻止传播，相当于 event.stopPropagation
  - prevent ------- 阻止默认，相当于 event.preventDefault
  - capture ------- 在捕获阶段触发
  - once ---------- 只触发一次
  - passive ------- 不会阻止 event.preventDefault
  - self ---------- ( 绑定事件的节点 ) 和 ( 事件触发的节点 ) 要是 ( 同一个节点 ) 才会触发
  - left ---------- 鼠标左键触发
  - right
  - middle
```
1
addEventListener
target.addEventListener(type, listener|具有handleEvent方法的对象[, useCapture｜{capture,once,passive}]);

2
绑定事件的三种方法
- HTML中通过 ( onClick="要执行的代码" )
- js中通过 DOM节点.onclick=function(){}
- js中通过 DOM节点.addEventListener('click', listener, useCapture)
- 优缺点
  - HTML
    - HTML标签中使用使用 ( on+事件名="需要执行的代码" )
    - 1. 只能在 ( 冒泡阶段 ) 触发
    - 2. 违反了 HTML 和 JS 分离的原则
  - 事件属性
    - 1. 只能在 ( 冒泡阶段 ) 触发
    - 2. 同一个事件，只能绑定 ( 一个监听函数 )，不能绑定多个
  - addEventListener
    - 1. 能指定事件触发的阶段，第三个参数是对象时，通过 capture 指定是否在捕获阶段触发，false则在冒泡阶段触发
    - 2. 同一个事件可以绑定多个监听函数
  - 总结
    - 推荐使用 addEventListener

3
事件修饰符的原理
- 主要依靠：( 模版编译 ) 原理，即在模版编译时做相关处理
- 1. prevent stop 在 ( 模版编译 ) 时，会直接在 ( 事件监听函数 ) 中添加 event.preventDefault 和 event.stopPropagation
- 2. capture，once，passive 在 ( 模版编译 ) 时，会在 ( 事件名前 ) 增加 ( 标识~!& )
  - capture ------> !
  - once ---------> ~
  - passive ------> &
  - 具体
    - html -------> <div @click.stop.prevent.once.capture></div> )
    - render -----> function render() { with(this) { return _c('div', [_c('div', { on: { "~!click": function ($event) {} } })]) } }
- 3. 键盘事件同理
```

### (13) $attrs 和 $listeners
- vm.$attrs
  - 包含：不在 ( props ) 中的 ( attribute )
  - 不包含：style 和 class
  - 传入组件内部：可以通过 v-bind="$attrs" 传入内部组件——在创建高级别的组件时非常有用
  - 案例：本项目/test-vue/$attrs/$attrs-$listeners.html
- vm.$listeners
  - 包含：了父作用域中的 v-on 事件监听器
  - 不包含：(不含 .native 修饰器的)  v-on 事件监听器
  - 传入组件内部：可以通过 v-on="$listeners" 传入内部组件——在创建更高层次的组件时非常有用
  - 案例：本项目/test-vue/$attrs/$attrs-$listeners.html
- 注意点：
  - 如果 ( 事件 ) 是通过 ( v-bind ) 的方式传递，仍然是一个 ( 属性 )，走 props 和 $attrs
  - 如果 ( 事件 ) 是通过 ( v-on ) 的方式传递，才会走 $listeners
- 扩展
  - 问题：vue 传递数据的方式
  - 回答：
    - props $attrs $listeners
    - vm.$emit
    - provide/inject -------- 不是响应式的
    - context
    - vuex router
    - $parent --------------- 父实例 - ( 例子:本项目/test-vue/test-$parent-$children.html )
    - $children ------------- 当前实例的直接子组件(数组) - (数组中的直接子组件)不能保证顺序，不是响应式

### (14) 为什么大Vue不使用class而是使用构造函数呢？
- 因为vue可以把不同的方法挂载原型链上，把实现代码单独抽离成文件，方便管理
- 而class的话，所有非静态属性(原型属性)都必须在class内部声明，不利于大型工程文件管理


### (15) 手写 v-model 双向数据绑定
- 详见：本项目/test-vue/v-model/handwrite-v-model.html

### (16) 环境变量
- 详见1
  - (5) 环境变量
  - https://github.com/woow-wu7/8-divine
- 案例
  - https://github.com/woow-wu7/4-joyo-lingjing-h5/blob/main/.env

### (17) vue如何在父组件中修改子组件的样式？
- 关键词：
  - ( /deep/ ) ( >>> ) ( ::v-deep ) ( :deep(){} )
  - scoped
```
vue如何在父组件中修改子组件的样式？
---
1
问题描述
在vue组件中，父组件和子组件都加了scoped属性后，会在当前组件元素上添加 data-v-hash 属性，默认情况下 ( 子组件的最外层具有两个自定义属性，分别是 【父组件的data-v-hash父】 和 【子组件的data-v-hash子】；而子组件除了最外层以外都只有-子组件的data-v-hash子 )，所以在父组件中不能选中子组件中的除了根元素以外的元素


---
(1) deep
- 表现
  - css 是 >>>
  - scss 是 /deep/
  - scss 是 ::v-deep
  - scss 是 :deep(){}
- 写法
  - 写法上一共有 4 种写法

<!-- 写法1 使用::v-deep -->
<style lang="scss" scoped>
  ::v-deep .ant-card-head-title{
    background: yellowgreen;
  }
</style>

<!-- 写法2 使用>>> 操作符-->
<style scoped>
>>>.ant-card-head-title{
  background: yellowgreen;
}
</style>

<!-- 写法3 使用/deep/ -->
<style scoped>
 /deep/.ant-card-head-title{
  background: yellowgreen;
}
</style>

<!-- 写法4 使用:deep(<inner-selector>) -->
<style lang="scss" scoped>
  :deep(.ant-card-head-title){
    background: yellowgreen;
  }
</style>


---
(2) 在vue文件中，使用不带 scope 的 style
```

# 相关链接

- https:github.com/woow-wu7/7-vue2-source-code-analysis/blob/main/src/core/observer/watcher.js
