# Vue 源码分析

## 一些单词
```
reserve 保留 // isReserved ---> vue中 ( $ 和 _ 是保留字 )
noop 空操作 // 常用来表示一个空函数 () => {}
polyfill 垫片 兜底
model 模型
```

## (一) 如何调试Vue2.0源码
### (1) 利用vue源码库代码进行调试
- 第一步
  - 克隆 vue2.0 源码
  - git clone git@github.com:vuejs/vue.git
  - 克隆下来的代码中的 dist 文件夹中有很多文件，其中最重要的是 vue.js 和 vue.js.map 文件
- 第二步
  - 在 根目录 新建一个 index.html
  - 在 index.html 中手动引入 vue 源文件`<script src="./dist/vue.js"></script>`，并写一些vue代码
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
    <script src="./dist/vue.js"></script>
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

## (七) 为什么data，props，methods中的key不能相同？
- 因为vue做了一层proxy后，可以通过vm.key访问，所以不能相同，相同后不能区分
- 在源码中就是先做了两次判断data和prop，methods中的key不能相同后，才进行proxy(vm, '_data', key)代理，把 data中的属性代理到vm上

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

// 观察器的配置（需要观察什么变动）
const config = { attributes: true, childList: true, subtree: true };

// 当观察到变动时执行的回调函数
const callback = function(mutationsList, observer) { ... ... }

// 创建一个观察器实例并传入回调函数
const observer = new MutationObserver(callback);

// 以上述配置开始观察目标节点
observer.observe(targetNode, config);

// 之后，可停止观察
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