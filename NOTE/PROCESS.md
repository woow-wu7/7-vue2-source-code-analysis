# 构建过程

### (1) 安装依赖

```安装依赖
npm init -y // -y 可以生成默认的package.json配置
npm install vue -D // 这里 -D 是因为是 vue 组件库并不是vue项目，安装默认是 v3 版本

npm install webpack -D
npm install webpack-cli -D
npm install webpack-dev-server -D
npm install webpack-merge -D // 合并 webpack 配置

npm install vue-loader vue-template-compiler html-webpack-plugin -D // -- vue组件处理 和 html模版处理
npm install file-loader url-loader -D // ------------------------------- 文件处理，url-loader通过limit处理成base64的图片
npm install style-loader css-loader -D // ------------------------------ 样式处理
npm install sass sass-loader node-sass -D // --------------------------- sass相关
npm install mini-css-extract-plugin -D // ------------------------------ 单独抽离成css文件，以便引入组件库的css，因为css和组件时单独打包的
npm install postcss-loader autoprefixer - D //-------------------------- 添加浏览器的前缀，可单独配置 postcss.config.js；autoprefixer需要在package.json中设置 browserslist
npm install html-loader markdown-loader -D // -------------------------- md 转成 html

npm install typescript ts-loader -D // --------------------------------- ts相关
npm install babel-loader @babel/core @babel/preset-env -D // ----------- babel可以把es6转成es5

npm install cross-env -D
npm install @types/node -D // 解决ts环境在模块中访问 process 时变量不存在的问题，详见 (3)-2


---
npm install @element-plus/icons-vue -S // icons，用于 breadcrumb
npm install vue-router@4 -S // router,用于 breadcrumb
npm install @vueuse/core -D // hooks
```

```说明文档
组件库说明文档相关

1. vuepress2
// 查看: vuepress最新的版本: npm view vuepress versions
// 安装: 指定版本的vuepress: npm install vuepress@2.0.0-beta.49 -D
// 版本: vuepress2.0才支持vue3。需要注意的是目前处于维护阶段，使用 vue3+vite 构建的使用 vitePress
npm install vuepress@2.0.0-beta.49 -D
npm install @vuepress/plugin-container@next -D // 容器
npm install @vuepress/plugin-back-to-top@next -D // 回到顶部
npm install @vuepress/plugin-register-components@next -D // 注册组件
npm install @vuepress/plugin-docsearch@next -D // 搜索
npm install @vuepress/plugin-git@next -D // git


2. js语法高亮
npm install highlight.js -D
npm install @highlightjs/vue-plugin -D


3. 将 md 转成 html
- docs: vite环境
  - npm install vite-plugin-markdown -D // ----------- 将md文件转成各种类型
  - npm install highlight.js -D // ------------------- 语法高亮
  - npm install @highlightjs/vue-plugin -D // -------- 包装组件
- examples: webpack环境
  - npm install html-loader markdown-loader -D // ---- 将 md 转成 html
```

### (2) 目录结构

```
.
├── Dockerfile
├── PROCESS.md
├── README.md
├── build
│   ├── webpack.config.base.js
│   ├── webpack.config.dev.js
│   ├── webpack.config.js
│   └── webpack.config.prod.js
├── docs
│   └── .vuepress
│   │   ├── config.js
│   │   ├── client.js
│   │   ├── components
│   │   ├── theme
│   │   ├── utils
│   │   ├── public
│   ├── README.md
│   └── components
├── examples
│   ├── app.vue
│   ├── main.ts
│   └── shims-vue.d.ts
├── global.d.ts
├── package.json
├── packages
│   ├── components
│   ├── hooks
│   ├── router
│   ├── theme-chalk
│   └── utils
├── public
│   ├── favicon.ico
│   └── index.html
├── test
├── tsconfig.json
└── yarn-error.log
```

### (3) vue3 和 webpack5 和 ts 遇到的一些问题

```
[1]
---
报错：Cannot read property 'isCE' of null in remote component with slot using Module Federation
原因: 打包时打了vue代码，因为 ( vue项目-使用组件库 ) 和 ( 插件组件库项目-组件库 ) 的vue版本不一致导致的问题
解决：
  - 1. webpack打包时，通过 externals 不去打包 vue
  - 2. vite构建同理
```

```
[2]
别名设置
---
1.webpack设置
resolve: { alias: {  "@": path.resolve(__dirname, "../packages") } }

2.typescript设置
- 问题：为什么设置了webpack的别名alias后，ts会报错找不到模块，并且vscode也不跳转？
- 回答：因为 webpack 设置别名后，typescript并不知道设置了别名，所以要设置 tsconfig.json
- 设置：需要在 tsconfig.json 中设置三个地方 ( baseUrl paths includes )
"baseUrl": "."
"paths": { "@/*": ["packages/*"] } -- 表示路径映射，相对于baseUrl，注意@/和packages/后面的*号，如果缺少了还是会报错！！！
"include": [ "packages/*"] ---------- 表示编译器需要包含的文件夹

3.测试详见 packages/utils
4.之前react项目设置别名资料 https://github.com/woow-wu7/7-react-admin-ts

5.扩展
遇到问题：当不通过别名，直接通过相对路径也报错找不到模块的解决方案
如何解决：
eg: backup组件
- a. 在 components 文件夹下编写 index.d.ts
- b. 在 package.json 中 include 添加路径  "packages/components/*"
```

```
[其他]
1
vue项目添加ts支持
- 说明: 本项目是通过 webpack 构建，所以需要修改 webpack 配置
- 官网: https://v3.cn.vuejs.org/guide/typescript-support.html#%E6%8E%A8%E8%8D%90%E9%85%8D%E7%BD%AE
module: { rules: [{
  test: /\.tsx?$/,
  loader: 'ts-loader',
  options: { appendTsSuffixTo: [/\.vue$/] }
}]}

2
报错: Error: Cannot find module 'vue-loader/lib/plugin'
原因: 在 webpack.config.js 中，这样的写法会报错 -- const VueLoaderPlugin = require("vue-loader/lib/plugin");
解决: 在 webpack.config.js 中，这样写 ---------- const { VueLoaderPlugin } = require("vue-loader");

3
报错: 找不到名称“process”。是否需要为节点安装类型定义? 请尝试使用 `npm i --save-dev @types/node`，然后将 “node” 添加到类型字段。ts(2591)
解决:
- 2.1 npm i --save-dev @types/node
- 2.2 { "compilerOptions": { "types": ["node"] } }

4
问题
  问题: process.cwd() 和 __dirname 的区别？
  回答:
  - process.cwd(): 指的是 ( webpack命令文件 - 所在的文件夹 )，命令在 package.json的scripts中，所以所在的文件夹是 ( 8-divine-plus )
  - __dirname: 指的是 ( __dirname当前文件所在的文件夹 )
  详见: build/webpack.config.prod.js
  文章: https://www.jianshu.com/p/a80c59abd1fb

5
问题: @import '~@/aa/bb' 中的 ~ 波浪号是什么意思？
回答:
  - 变量: 当 @import 的路径中包含 ~ 时，表示的后面是一个变量
  - 查找顺序：该变量首先会去 ( webpack 的 resolve.alias 中查找 )，没有才会去 ( node_modules ) 中查找
  - 链接：https://segmentfault.com/q/1010000010879017

6
tree
命令:
  - tree -I node_modules -L 2
  - -I 表示忽略 node_modules 文件夹
  - -L 表示只显示2层关系

7
报错: ts报错类型“NodeRequire”上不存在属性“context”
解决:
 - 1. npm install @types/webpack-env -D
 - 2. 在 tsconfig.json 中 types 数组中添加 "webpack-env" 去自动引入 "@types/webpack-env" 包
 - 3. 在 tsconfig.json 中 include 数组中添加 webpack语法所在的 ts 文件
```

# 资料

- 环境变量区别 https://juejin.cn/post/6844904023791796237#heading-0
- tsconfig.json https://www.pengfeixc.com/blogs/javascript/tsconfig
- 构建过程 https://juejin.cn/post/6950905030635421710
- webpack
  - require.context https://webpack.js.org/guides/dependency-management/#requirecontext
- npm
  - 打包发布流程 https://juejin.cn/post/6994746118135349262
  - 发布相关 https://blog.51cto.com/u_15328720/3401308
- package.json
  - exports: https://zhuanlan.zhihu.com/p/159202959
  - files: https://juejin.cn/post/6844903975825702926#heading-8
  - &和&&: https://www.jianshu.com/p/c96fdba92c44
- vuepress2
  - 官网: https://juejin.cn/post/7096011121160618020
  - 教程: https://www.cnblogs.com/wangdashi/p/16308107.html
  - 教程: https://github.com/Lee-Tanghui/vuepress-element-doc
  - 教程: https://juejin.cn/post/7089313579169480711
  - 插件: https://blog.csdn.net/sinat_31213021/article/details/119385175
- 参考 ui 组件库
  - element-plus https://github.com/element-plus/element-plus
  - fes-design https://github.com/WeBankFinTech/fes-design
  - mzl-ui https://github.com/Ningstyle/mzl-ui#readme
