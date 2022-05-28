# Vue 源码分析

## 一些单词
```
reserve 保留 // isReserved ---> vue中 ( $ 和 _ 是保留字 )
noop 空操作 // 常用来表示一个空函数 () => {}
polyfill 垫片 兜底
model 模型
primitive 原始的
internal 内部的
recursive 递归
teardown 拆卸

camel 骆驼
```



# 其他源码

### (1) redux 和 react-redux 源码分析 [redux^4.0.5]
- [redux源码分析-仓库](https://github.com/woow-wu7/7-react-admin-ts/tree/master/src/SOURCE-CODE-ANALYSIS/REDUX)
- [redux源码分析-我的掘金博客](https://juejin.cn/post/6844904137952329742)

### (2) 手写 webpack Compiler 源码 [webpack^4.42.0]
- [手写Compiler源码-仓库](https://github.com/woow-wu7/7-compiler)
- [手写Compiler源码-我的掘金文章](https://juejin.cn/post/6844903973002936327)

### (3) axios 源码分析 [axios^0.20.0]
- [axios源码分析-仓库](https://github.com/woow-wu7/7-react-admin-ts/tree/master/src/SOURCE-CODE-ANALYSIS/AXIOS)
- [axios源码分析-我的掘金文章](https://juejin.cn/post/6844904147532120072)
- [cancel取消请求的原理，interceptor拦截器的原理 - 两个重点掌握](https://github.com/woow-wu7/7-react-admin-ts/tree/master/src/pages/admin-system/interview-cancel/index.tsx)

### (4) vue 源码分析 [vue^2.6.12]
- [vue源码分析-仓库](https://github.com/woow-wu7/7-react-admin-ts/tree/master/src/SOURCE-CODE-ANALYSIS/VUE)
- [vue源码分析-新建仓库](https://github.com/woow-wu7/7-vue2-source-code-analysis)
- [vue源码分析-我的掘金文章](https://juejin.cn/post/6844904181094957069)

### (5) vuex 源码分析 [v2.6.10]
- [vuex源码分析-我的掘金文章](https://juejin.cn/post/6844904166293241863)

### (6) react 源码分析 [react^17.0.3]
- [react源码分析-仓库](https://github.com/woow-wu7/7-react-source-code-analysis)
- [react源码分析-我的掘金文章](https://juejin.cn/post/6993980489463758855)
- [js实现单向链表 - 源码](https://github.com/woow-wu7/7-react-source-code-analysis/blob/main/src/manual/linked-list.js)
- [手写hook调度-useState实现 - 源码仓库](https://github.com/woow-wu7/7-react-source-code-analysis/blob/main/src/manual/hooks-manual.js)
- [手写hook调度-useState实现 - 思维导图](https://github.com/woow-wu7/7-react-source-code-analysis/blob/main/src/images/hook-useState.png)

### (7) a-hooks 源码分析 [a-hooks^2.10.9]
- [a-hooks源码分析 - 仓库](https://github.com/woow-wu7/7-a-hooks-source-code-analysis)

### (8) a-hooks 源码分析 [a-hooks^3.1.9]
- [a-hooks源码分析 - 仓库](https://github.com/woow-wu7/7-a-hooks3.0-source-code-analysis)

### (9) koa 源码分析 [koa^2.13.1]
- [koa源码分析 - 仓库](https://github.com/woow-wu7/7-koa-source-code-analysis)
- [koa源码调试 - 仓库](https://github.com/woow-wu7/7-koa-source-code-analysis)
- 注意分析：( axios拦截器 + redux中间件 + koa中间件 ) 三者的相同点和区别

### (10) badJs-report 源码分析
- [badJs-report源码分析-仓库](https://github.com/woow-wu7/7-badjs-report-analysis)

### (11) element-ui 源码分析
- [element-ui 源码分析-仓库](https://github.com/woow-wu7/8-element-source-code-analysis)


## 虚拟DOM
- [手写diff算法-snabbdom](https://github.com/woow-wu7/7-vue2-source-code-snabbdom)


## (一) 如何调试Vue2.0源码
### (1) 利用vue源码库代码进行调试
- 第一步
  - 克隆 vue2.0 源码
  - git clone git@github.com:vuejs/vue.git
  - 克隆下来的代码中的 dist 文件夹中有很多文件，其中最重要的是 vue.js 和 vue.js.map 文件
- 第二步
  - 在 根目录 新建一个 index.html
  - 在 index.html 中手动引入 vue 源文件`<script src="../dist/vue.js"></script>`，并写一些vue代码
  - 在浏览器中打开 index.html
  - **因为**：F12调试，查看 Sources 中的 dist 文件中只有 vue.js，这样是不能调试源码的
  - **所以**：我们需要继续以下步骤，实现可以调试源码
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script src="../dist/vue.js"></script>
  </head>
  <body>
    <div id="app">
      <p>{{count}}</p>
    </div>
    <script>
      new Vue({
        el: '#app',
        data() {
          return {
            count: 1
          }
        }
      })
    </script>
  </body>
</html>
```
- 第四步
  - 在 package.json 的 scripts 中 dev 脚本命令增加 --sourcemap
  - "dev": "rollup -w -c scripts/config.js --environment TARGET:web-full-dev --sourcemap"
- 第五步
  - cnpm install
  - cnpm run dev
  - 再在浏览器中打开 index.html，再F12调试，再看到Sources面板，发现多出了 src 文件，就是整个vue的源文件了
  - 现在就可以断点调试vue2的源码了

### (2) 利用vue-cli新建项目调试
- 第一步
  - 使用 vue-cli 新建一个vue2的项目
- 第二步
  - 找到 node_modules 中的 vue
  - 找到 vue 的 package.json 中的 main 和 module 字段
    - 1. main，module，browser的区别
      - **main**：定义了npm包的入口文件，browser和node环境都能使用
      - **module**：定义了npm包的ESM规范的入口文件，browser和node环境都能使用 - ESM就是 es module
      - **browser**：定义 npm 包在 browser 环境下的入口文件
    - 2. **main，module，browser的加载顺序**
      - `browser > module > main`
    - 3. .js 和 .mjs 的区别
      - .mjs：是在node环境中能执行ESM规范代码的文件
      - 优先级： ( `.mjs > .js` ) 即 import 和 require 时优先加载 `.mjs` 文件
  - 在dist文件夹中找到 `vue.esm.js` 文件
    - debugger 想要的代码即可

## (二) 对比 vue 和 react-redux 源码中对 plainObject 纯对象的判断

### 前置知识
- 我原型链的文章 https://juejin.cn/post/6844904048873701389/#heading-21
```
1
typeof
typeof 返回的数据类型，一共有 7 种
- number string boolean undefined symbol
- object function

2
原型链
2.1 函数
- 所有的 ( 函数 )，都是大写的 ( Function.prototype ) 的实例
- 包括自身，即 Function.__proto__ === Function.prototype
2.2 函数的prototype
- 所有 ( 函数的prototype )，都是大写的 ( Object.prototype ) 的实例
- 除了Object，即 Object.prototype === null
2.3 案例
- 2.3.1
Function.__proto__ === Function.prototype 所有的函数都是Function.prototype对象的实例
- 2.3.2
function Constructor(){}
Constructor.__proto__ === Function.prototype 所有的函数都是Function.prototype对象的实例
Constructor.prototype.__proto__ === Object.prototype 所有 函数的prototype 都是 Object.prototype 的实例

3
Object.is 和 === 的区别
Object.is 用来判断两个值是否严格相等
+0 === -0 // true
Object.is(+0, -0) // false
NaN === NaN // false
Object.is(NaN, NaN) // true
Object.is({}, {}) // false，因为不是同一个引用
```

### (1) 什么是 plainObject
- 定义：通过对象字面量方式定义的对象{}和通过Object.create()定义的对象就是plainObject
- const obj = {}
- const obj = Object.create()

### (2) react-redux 对 plainObject 的utils函数的定义
- 分析1
  - 因为：`const obj = Object.create(null)`
  - 所以：`Object.getPrototypeOf(obj) === null` // true
- 分析2
  - 因为：`const obj = {}`
  - 所以：`Object.getPrototypeOf(obj) === Object.prototype` // true
```
react-redux 中如何利用 ( 原型链 ) 来判断是否是 plainObject
-------

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
 export default function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = Object.getPrototypeOf(obj)

  if (proto === null) return true // 说明是通过 Object.create(null) 创建，生成的就是一个plainObject

  let baseProto = proto

  while (Object.getPrototypeOf(baseProto) !== null) {
    // 如果：( 参数对象 ) 的原型对象不是 ( null )，即满足while的条件
    // 那么：就一层层往上赋值成原型对象，直到参数对象的原型对象是null
    // 而：Object.prototype === null
    // 所以：baseProto === Object.prototype 就终止寻找
    baseProto = Object.getPrototypeOf(baseProto)
  }

  // 2. 原型链第一个和最后一个比较
  // 因为：plainObject对象的 obj.__proto__ === Object.prototype
  // 所以：是 plainObject 返回 true

  // 3
  // 对比一下
  // function 的情况
  // 假设我们这里obj是一个 function
  // proto 是 Function.prototype
  // baseProto 是 Object.prototype
  // 所以：当参数传入的是一个function的时，返回的是 false，说明不是一个纯对象

  // 4
  // 对比一下
  // array 的情况
  // 假设我们这里obj是一个 array
  // proto 是 Array.prototype
  // baseProto 是 Object.prototype
  // - Object.getPrototypeOf([]) === Array.prototype
  // - Object.getPrototypeOf(Array.prototype) === Object.prototype // 任何函数的prototype 都是 Object.prototype 的实例
  // 所以：当参数传入的是一个数组的时，返回的是 false，说明不是一个纯对象

  return proto === baseProto
}
```

## (三) 为什么组件被定义，data必须是一个函数，并且该函数返回一个数据对象？
- data的数据类型
  - 对象
  - 函数
- 为什么组件被定义，data必须是一个函数，并且该函数返回一个数据对象？
  - 因为：
    - data属性是被挂载在构造函数的prototype上的
      - data如果是一个对象，实例会共享，修改会相互影响
      - data如果是一个函数，内部返回一个对象，则每次执行data都会返回用对象字面量新生成一个新的对象，在不同的内存当中
  - 详细
    - 如果data是对象：则所有实例都会 ( 共享引用 ) ( 同一个data对象 )
    - 如果data是函数：则每次新建实例，获取或修改data时，都会调用data函数，生成新的data对象并返回，是不同的地址，独立不影响
```
function Component() {
  this.data = this.data();
}
Component.prototype.data = function () {
  return {
    count: 100,
  };
};
const component1 = new Component()
const component2 = new Component()
console.log(component1.data === component2.data) // false
```

## (四) runtime 和 runtime+compiler版本 有什么区别？
- runtime版本
  - 直接使用render函数，不能使用 template 模版
  - 渲染过程：`render函数 -> vnode -> 真实的dom`
- runtime+compiler版本
  - 会在运行的时候将template转成render函数执行
  - 渲染过程：`template -> render函数 -> vnode -> 真实的dom`
- 运行时版本相比完整版体积要小大约 30%

## (五) 为什么大Vue不使用class而是使用构造函数呢？
- 因为vue可以把不同的方法挂载原型链上，把实现代码单独抽离成文件，方便管理
- 而class的话，所有非静态属性(原型属性)都必须在class内部声明，不利于大型工程文件管理

## (六) Node.nodeType
```
元素节点 element 1
属性节点 attr 2
文本节点 text 3

注释节点 comment 8
文档节点 document 9
文档类型节点 documentType 10
文档片段节点 documentFragment 11
```

## (七) 为什么data，props，methods，computed中的key不能相同？
- 因为vue做了一层proxy后，可以通过vm.key访问，所以不能相同，相同后不能区分
- 在源码中就是先做了两次判断data和prop，methods中的key不能相同后，才进行proxy(vm, '_data', key)代理，把 data中的属性代理到vm上
- 初始化的顺序是：props，methods，data，computed
- computed中的属性同样也不能和props，methods，data中的属性一样

## (八) nextTick
- 其实就是逐渐降级的过程
- Promise -> MutationObserver -> setImmediate -> setTimeout

### (8.1) 前置知识
- **ref**
```111
1. ref
---
- 作用
  - ref用来给 ( DOM元素 ) 或 ( 子组件 ) 注册引用信息
  - 引用信息将会注册在父组件的 ( $refs ) 对象上
- 使用
  - 在DOM元素上使用：引用指向 ( DOM元素 )
  - 在子组件上使用：引用指向 ( 组件实例 )
- 注意点
  - 不能在初始化渲染时访问
  - $refs 不是响应式的
- 常见案例
  - 1.获取DOM元素
  - 2.在父组件中获取子组件中的方法
```

- **this.$nextTick(callback)**
```222
2. this.$nextTick(callback)
---
案例：
  - 利用ref绑定DOM元素，通过 this.$refs 对象获取具体绑定的DOM元素
  - 然后测试同步获取DOM的属性值，和this.$nextTick()获取DOM属性值 ( 更新后，直接获取ref的属性时并未变化，需要使用nextTick获取最新的DOM元素属性值)
考点：
  - this.$refs
  - this.$nextTick(callback)
-------
<body>
  <div id="root">
    <p>{{count}}</p>
    <button @click="add">change count</button>
    <input type="text" ref="inputRef" v-model="count" id="count" />
    <!-- ref -->
  </div>
  <script>
    new Vue({
      el: "#root",
      data() {
        return {
          count: 1,
        };
      },
      methods: {
        getInputValueBySync(type) {
          const inputValue = this.$refs.inputRef.value; // ----- this.$refs
          console.log(type, inputValue);
        },
        getInputValueByRefs(type) {
          this.$nextTick(() => { // ----------------------------- this.$nextTick()
            this.getInputValueBySync(type);
          });
        },
        add() {
          this.count = this.count + 1;
          this.getInputValueBySync("sync"); // 1
          this.getInputValueByRefs("async - this.$nextTick"); // 2
        },
      },
    });
  </script>
</body>
```

- **this.$nextTick().then(callback)**
```333
3. this.$nextTick().then(callback)
---
<body>
  <div id="root">
    <p ref="countRef">{{count}}</p>
    <button @click="add">直接获取innerHTML</button>
    <button @click="addNextTickThen">nextTick.then()获取innerHtml</button>
  </div>
  <script>
    new Vue({
      el: "#root",
      data() {
        return {
          count: 1,
        };
      },
      methods: {
        add() {
          this.count = this.count + 1;
          const _innerHTML = this.$refs.countRef.innerHTML;
          console.log(`直接通过this.$refs获取p标签的innerHtml`, _innerHTML); // 获取的是更新前的值
        },
        addNextTickThen() {
          this.count = this.count + 1;
          this.$nextTick().then(() => {
            const _innerHTML = this.$refs.countRef.innerHTML;
            console.log(
              `在this.$nextTick().then()的回调中，通过this.$refs获取p标签的innerHtml`, // 获取的是更新后的值
              _innerHTML
            );
          });
        },
      },
    });
  </script>
</body>
```

- **宏任务 和 微任务**
```444
4. 宏任务 和 微任务
---
- 常见的宏任务
  - setTimeout
  - setInterval
  - setImmediate // 在node的poll阶段之后的check阶段中执行
  - requestAnimationFrame
- 常见的微任务
  - promise
  - process.nextTick // 在node生命周期的任意阶段优先执行，因为它是一个微任务
  - MutationObserver
```

```555
5
需求: 要在数据更后，立即获取DOM，而此时DOM并没有更新，需要拿到最新的DOM怎么办？
回答：就可以使用 Vue.nextTick() 或者 VM.$nextTick() 在更新数据后获取更新后的DOM
```

- **MutationObserver()**
```666
6. MutationObserver
---
函数：MutationObserver(callback)

作用：监测DOM的变化，DOM发生变化，就会触发MutationObserver的回调

特点：
  - 异步触发：它是 ( 异步触发 )，DOM 的变动并不会马上触发，而是要等到当前所有 DOM 操作都结束才触发
  - 一起处理：它把 DOM 变动记录封装成一个 ( 数组 ) 进行处理，而不是一条条个别处理 DOM 变动


案例：

// 目标节点 - 选择需要观察变动的节点
const targetNode = document.getElementById('id');

// 配置对象 - 观察器的配置对象（需要观察什么变动）
const config = { attributes: true, childList: true, subtree: true };

// 当观察到变动时执行的回调函数
const callback = function(mutationsList, observer) { ... ... }

// 创建一个观察器实例并传入回调函数
const observer = new MutationObserver(callback);

// 开始观察目标节点
// observer.observe(目标节点，配置对象)
observer.observe(targetNode, config);

// 停止观察
observer.disconnect();
```

### (8.2) nextTick 源码核心流程
```
1. 向 callbacks 队列中push这样一个函数，两种类型
    - () => cb.call(ctx)
    - () => _resolve(ctx)

2. 执行 timerFunc()

3. timerFunc() 是一个逐渐降级的过程：Promise -> MutationObserver -> setImmediate -> setTimeout
  - timerFunc = () => { Promise.resolve().then(flushCallbacks) }
  - timerFunc = () => { counter = (counter + 1) % 2 textNode.data = String(counter) }
  - timerFunc = () => { setImmediate(flushCallbacks) }
  - timerFunc = () => { setTimeout(flushCallbacks, 0) }

4. flushCallbacks() 执行 callbacks 队列中的所有方法
```

## (九) Vue.set 和 vm.$set，Vue.delete 和 vm.delete
- vm.$set 是 Vue.set 的别名
- delete 和 set 类似

### (9.1) 对象不会响应式更新的情况
- 原因：( data ) 和 ( data属性 ) 是对象时，响应式实现是通过 Object.defineProperty 实现
- 情况：只能响应对象 ( 已有属性的修改 )，不能响应对象属性的 ( 添加 ) 和 ( 删除 )
- 解决方案
  - **添加**
    - Vue.set()
    - vm.$set()
    - 直接给对象重新赋值一个新的对象：返回一个新的对象 Object.assign({}, this.object, 添加新的属性的对象) 或者 {...this.obj, 新添加的属性：value}
  - **删除**
    - Vue.delete()
    - vm.$delete()

### (9.2) 数组不会响应式更新的情况
- 不响应的情况
  - 直接通过下表修改数组成员的值 arr[0] = 1000
  - 直接修改数组的长度 arr.length = 1000
- 解决方案
  - 1. 利用重写的数组的7种方法：push pop unshift shift splice sort reverse
  - 2. **添加，修改**: Vue.set(), vm.$set(), splice
  - 3. **删除**：Vue.delete(), vm.$delete(), splice

### (9.3) Vue.set() 源码主流程
```
Vue.set(this.obj, 'b', 2)

1. 当obj是undefined,null,基本类型数据时，抛出警告，即响应式对象必须是 ( 数组 或 对象 )

2. 处理数组：
  - 修改，添加，删除都通过重写后的 target.splice(key, 1, val) 来完成
  - 将要处理的目标值构造成数组，通过ob.observeArray(inserted)继续观察，然后 ob.dep.notify() 手动派发更新，然修改的值反应在DOM上

3. 响应式处理对象 - ( 即 value.ob = observer 存在 )
  - 就是 defineReactive(ob.value, key, val) 对新添加的对象属性新建立响应式
  - 然后 ob.dep.notify() 手动通知变化后更新
    - 因为在访问时已经对data的子对象obj做了 let childOb = !shallow && observe(val) ---> childOb.dep.depend()
    - 所以render watcher 订阅了 obj 的dep，obj变化就能通过到渲染watcher重新渲染

4. 普通的非响应式对象
  - 直接赋值
```

## (十) computed
- 初始化
  - new Vue() -> this.init() -> initState() -> initComputed()
- 如何判断一个Watcher是一个 computedWatcher
  - 通过 new Watcher(vm, getter, noop, computedWatcherOptions) 中的最后一个参数配置对象 {lazy:true} 来判断
- 注意点
  - 结果：computed初始化时，不会立即求值，而是要被访问的时候才会去求值
  - 原因：new Watcher() 时，会根据lazy=true的话，就不会执行 watcher.get()
  - 什么时才去计算：
    - 因为在初始化时，会对computed对象定义成响应式对象
    - computed对象中的每个属性都会进行如下流程Object.defineProperty(vm, computed中的key, sharedPropertyDefinition)
    - sharedPropertyDefinition -> watcher.evaluate() -> this.get() -> pushTarget(this) -> this.getter -> computed对象中的方法执行，因为依赖了(data, computed) 等，又会走data的依赖收集和派发更新流程
- 总结
  - 1. **computed计算属性只有在computed被访问时，才会去计算**
  - 2. **computed计算属性具有缓存功能**
    - dirty=true时，才会去执行watcher.evaluate() 方法
    - 下次在访问时，依赖没有变化时，dirty=false，直接返回  watcher.value 即之前计算的值
  - 3. **computed的依赖必须是响应式数据，不然即使依赖变化不会触发computed重新计算**
  - 4. **computed的依赖变化了，但是computed计算的值没有变化的话，不会从新渲染**

## (十一) watch
- 支持的语法
  - **vm.$watch**
  - **watch对象** options中定义的watch对象
- watch对象中的key的类型
  - function
  - string
  - array
  - object
    - **handler**
    - **deep**
      - deep深度监听深层对象属性的变化，递归访问做依赖收集
    - **immediate**
      - immediate立即执行
    - **sync：**
      - sync的watch优先执行
    - 最终都会把不同类型的 handler 转换成函数
    - 必须要有 handler 属性
- 可能的死循环
  - watch: { count: {this.count = this.count + 1}}
  - watch了count，count变化执行watch，watch执行又改变了count，count变化继续执行watch，死循环
  - count变化 -> watcherHandler() -> 修改count -> count变化 -> watcherHandler()

### (11.1) watch 源码的 ( 初始化 ) 流程梳理
```
1
new Vue() -> this._init() -> initState() -> initWatch()


2
initWatch() -> createWatcher() -> vm.$watch()
- 处理watch对象中的key对应的不同value类型，value的类型可以是下面的几种
  - function
  - string：表示method
  - object：具有 handler，deep，immediate，sync 属性
  - array：array的成员可以是上面三种，比如 [string, object, function]


3
vm.$watch() -> new Watcher() -> this.get() -> this.getter()
- new Watcher(vm, expOrFn=watch.key, cb=watch.value, { user: true})
  - 实例化一个 user watcher，user watcher的特点是配置对象中的 user=true；注意如果handler是对象，对象中的属性也会在这个对象中，比如deep,immediate,sync
  - this.getter = parsePath(expOrFn) = function (obj) { for (let i = 0; i < segments.length; i++) { obj = obj[segments[i]] } return obj }
  - this.get() -> 会执行 this.getter() -> 然后就会访问到vm[key] -> 执行watch对象中的handler函数
    - key就是watch对象中的每一个key，这个key其实就是data中的属性
    - 访问到data属性就会走依赖收集的流程即dep.depend()
    - 注意：这里是user watcher订阅的data属性的dep，也就是说data属性变化时，除了renderWatcher外，userWatcher也会执行，因为userWatcher也订阅了data的属性的变化
```
### (11.2) watch 源码的 ( 更新 ) 流程梳理
- 更新流程其实很简单，就是走 dep.notify()
- 注意：watch的是data，data变化时，其实是有renderWatcher和userWatcher订阅了data数据的变化，所以都会执行并计算


## (十二) Vue.extend

### (12.1) Vue.component() 全局注册
- 组件注册分为 全局注册 和 局部注册
  - **全局注册**：Vue.component()
  - **局部注册**：在 new Vue({components: {}|[]}) 时，通过 components 属性进行注册
- Vue.component 作用
  - 注册和获取全局组件
  - 组件是可复用的Vue实例，且带有一个名字，就是传入Vue.component的第一个参数id
- Vue.component( id, [definition] )
  - {string} **id** ------------------------- 组件名字
  - {Function | Object} **[definition]** ---- 和new Vue(options) 中的 options 具有相同的属性
```
Vue.component('my-component', Vue.extend({})) // --------- 注册组件，传入一个扩展过的构造器，使用Vue.extend()
Vue.component('my-component', {}) // --------------------- 注册组件，传入一个选项对象 (内部会自动调用 Vue.extend)
var MyComponent = Vue.component('my-component') // ------- 获取组件，获取注册的组件 (始终返回构造器)
```

### (12.2) Vue.component 如何使用
```<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script src="../dist/vue.js"></script>
  </head>
  <body>
    <div id="app">
      <base-button name="BaseButton">
    </div>
    <script>
      Vue.component('BaseButton', {
        props: ['name'],
        data() {
          return {
            count: 0
          }
        },
        methods: {
          add() {
            this.count = this.count + 1
          }
        },
        template: `
          <div>
            <p>{{count}}</p>
            <button @click="add">{{name}}</button>
          </div>
        `
      })
      new Vue({
        el: "#app",
      });
    </script>
  </body>
</html>
```

### (12.3) Vue.extend()
- 作用
  - 使用基础 Vue 构造器，创建一个 **子类**
  - 注意是 ( **子类** )，而不是 ( 实例 )
  - 其实从名字就知道是继承，class的继承，子类可以通过 new 来调用
- 语法
  - Vue.extend( options )
  - 参数
    - {Object} options 一个包含组件选项的对象
    - **data属性是特例，注意在 Vue.extend({data(){return {...}}}) 中 data属性必须是一个函数**
    - **Vue.component() 和 Vue.extend() 的参数对象中的 data 都必须是一个 函数**

## (十三) Vue.filter()
- 全局的 和 组件配置对象中的filters
- 详见 Test-filter.html

### (13.1) 驼峰命名CamelCase 和 帕斯卡命名pascalCase
- **驼峰命名(CamelCase)**
  - myFirstName、myLastName
- **帕斯卡命名(PascalCase)**
  - MyFirstName、MyLastName

## (十四) vm.$attrs 和 vm.$listeners
- 详见 Test-attrs-listeners.html
- HOC - decorator装饰器模式的运用 - Test-vue-hoc-debounceButton.html
### (14.1) vm.$attrs
- 包含了父作用域中不作为 prop 被识别 (且获取) 的 attribute 绑定，除了 (  class 和 style )
- 可以通过 v-bind="$attrs" 传入内部组件——在创建高级别的组件时非常有用
### (14.2) vm.$listeners
- 包含了父作用域中的 (不含 .native 修饰器的) v-on 事件监听器
- 可以通过 v-on="$listeners" 传入内部组件——在创建更高层次的组件时非常有用
- `this.$listeners.click` 获取 `v-on:click="go"` 指定的click事件的go监听函数
### (14.3) vm.$slots 和 vm.$scopeSlots
- `vm.$slots`
  - 用来访问被 ( 插槽分发 ) 的内容
  - `v-slot:foo` 中的内容将会在 `vm.$slots.foo` 中被找到
  - 请注意插槽不是响应性的
- `vm.$scopeSlots`
  - 用来访问作用域插槽


## (十五) Vue.use()
- 文件位置 `src/core/global-api/use.js`
```
export function initUse(Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 每个 Vue 的 plugin 是对象时都具有一个install方法，是函数时本身会被当作install方法
    const installedPlugins = this._installedPlugins || (this._installedPlugins = []);
    if (installedPlugins.indexOf(plugin) > -1) {
      // 如果已经注册过该插件，返回this
      // this表示大Vue，返回this，表示不再往下执行，同时可以实现链式调用，Vue.use().use()
      return this;
    }

    // additional parameters
    // - Vue.use(plugin, additionalParameters) 附加的可选的第二个配置项对象参数
    const args = toArray(arguments, 1);
    // args
    // - 注意这里的 arguments 是 Vue.use()方法中的 arguments
    // - 这里表示：获取 Vue.use() 的第二个参数 options 对象

    args.unshift(this);
    // 将大 Vue 添加进参数数组最前面

    if (typeof plugin.install === "function") {
      // 插件是对象，install方法存在并且是function，调用
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === "function") {
      // 插件本身是函数，调用
      plugin.apply(null, args);
    }

    installedPlugins.push(plugin); // 为注册过该插件，调用插件后，把该插件添加进插件数组，用于之后判断是否注册过该插件

    return this; // 同样的，插件 注册过 和 未注册过 都在最后返回 Vue，实现Vue.use() 的链式调用
  };
}
```


# Xmind
- [xmind-思维导图](https://github.com/woow-wu7/7-vue2-source-code-analysis/blob/main/xmind/)
# 资料
- [[源码-vue01] data响应式 和 初始化渲染 ](https://juejin.im/post/6844904181094957069)
- [[源码-vue02] computed 响应式 - 初始化，访问，更新过程 ](https://juejin.im/post/6844904184035147790)
- [[源码-vue03] watch 侦听属性 - 初始化和更新 ](https://juejin.im/post/6844904186652409863)
- [[源码-vue04] Vue.set 和 vm.$set](https://juejin.im/post/6844904190918000654)
- [[源码-vue05] Vue.extend](https://juejin.im/post/6844904201944825863)
- [[源码-vue06] Vue.nextTick 和 vm.$nextTick](https://juejin.im/post/6847902219107303438)
- 源码调试 https://juejin.cn/post/6883002751769378829