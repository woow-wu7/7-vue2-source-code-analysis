# Vue 源码分析

## (一) 如何调试Vue2.0源码
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

# 资料
- 源码调试 https://juejin.cn/post/6883002751769378829