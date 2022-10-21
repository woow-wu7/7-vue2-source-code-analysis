# 组件库需要用到的 Sass 知识点

### (1) 知识点

```!default
1
!default
- 作用：在 ( 变量的结尾 ) 加上 ( !default )
  - 1. 如果变量没有被赋值，则变量被重新赋值，即使用 !default 的值
  - 2. 如果变量已经被赋值，则不会被重新赋值
  - 从语意上来理解，就是默认值的意思，即有值就用之前的值，没有就使用default的值
---

$width: 1px;
$width: 2px !default; // 变量后加!default，变量已经定义过，不会使用新的值，使用旧的值
$color: red !default; // 变量后加!default，变量未定义值，则使用新的变量
.p {
    width: $width; // -- 1px，定义过使用之前的值
    color: $color; // -- red，没定义过使用最新的值
}
```

```!global
2
!global
- 作用：用来设置 ( 全局变量 )
---

(1)
未使用 !global 前
---
$var: red;
@mixin foo($var: $var) {
    default-color: $var; // 这里的所有 $var 都是局部变量，是通过参数传入的，等于传入参数的值
    $var: green; // 局部变量，变量$var被设为green；在局部作用域中，$var都会被设为green
    scoped-color: $var; // 局部变量，被设置成了 green
}
.bar {
    @include foo($var);
    color: $var; // 这里 color 引用的是 全局变量 $var
}
被编译为
.bar {
  default-color: red;
  scoped-color: green;
  color: red;
}


(2)
使用 !global 后
---
$var: red;
@mixin foo($var: $var) {
    default-color: $var;
    $var: green !global; // 局部变量，变量$var被设为green；在局部作用域中，$var都会被设为green
    scoped-color: $var; // 注意：上面修改的是全局变量，而这里是局部变量未被修改，所以是 red
}
.bar {
    @include foo($var);
    color: $var; // 这里 color 引用的是 全局变量 $var，全局变量$var被修改成了 green
}
被编译为
.bar {
  default-color: red;
  scoped-color: red;
  color: green; // color 是全局变量
}
```

```@mixin @include @content
3
@mixin @include @content
@mixin 和 @include 和 @content
- @mixin aa -----> 定义一个混合器aa
- @include aa ---> 使用混合器aa
- @content; ------> 将 @include aa 中定义的样式引入到 @mixin 中
---
扩展: 注意 @mixin 和 @extends 的区别
---

<style scoped lang="scss">
@mixin test-mixin($color: red) { // -- @mixin
  // 1
  // $color: red
  // 这里冒号后面是默认值，在没有传入参数时，默认值生效
  div {
    background: $color;
    @content; // -------------------- @content 将 @include中定义的样式引入到 @mixin 的 div 中
  }
}
#app {
  .content {
    @include test-mixin(yellow) { // @include，花括号中的内容在 @mixin中 可以通过 @content 来引用
      font-size: 30px; // 同时，@mixin 可以接收变量，这里传入 yellow 作为 $color 的值
      font-weight: 700;
    }
  }
}
</style>
```

```插值语句 #{}
4
插值语句 #{}
- 通过 `#{}` 插值语句可以在 ( 选择器 ) 或 ( 属性名 ) 中使用 ( 变量 )
- 2022/07/25补充：插值语句也可以在 ( 属性值 ) 中插入SassScript
---

$name: foo;
$attr: border;
p.#{$name} { // -------------- #{} 插值语句在 ( 选择器 ) 中使用
  #{$attr}-color: blue; // --  #{} 插值语句在 ( 属性名 ) 中使用
}
编译为
p.foo {
  border-color: blue;
}
```

```@at-root
5
@at-root
- 将 ( 父级选择器 ) 直接暴力的改成 ( 本文件的根选择器 )，即和最外层父级元素同级，而不是其子元素
- 2022/02/25 更新如下
- 1. & -------------------------- 指的 ( 一定是最近的父级 )
- 2. @at-root ------------------- 指的 ( 一定是 当前文件的 最外层的父级 )
---
.p {
    color: blue;
    .h1 {
        color: yellow;
        @at-root {
            .div {
                color: red;
            }
        }
    }
}
编译为：
1. 其中 .p 和 .h1 没有变化
2. .div 被提到了文件的顶层
.p { color: blue; }
.p .h1 { color: yellow; }
.div { color: red; } // 被提升到该文件的最外层
```

```@each ... in ...
6
@each
@each ... in ...
格式为 @each var in <list>|<map>
- var 表示任意变量名
- list 表示 ( 数组 )，是一连串的值
- map 表示 (a:b, c:d)，map时需要使用两个变量，分别表示 key 和 value

--------
list
@each $animal in puma, sea-slug, egret {
  .#{$animal}-icon {}
}
编译为
.puma-icon {}
.sea-slug-icon { }
.egret-icon {}

--------
map
@each $header, $size in (h1: 2em, h2: 1.5em, h3: 1.2em) {
  #{$header} {
    font-size: $size;
  }
}
编译为
h1 { font-size: 2em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.2em; }
```

```@for
7
@for
@for ... from ... to
@for ... from ... through
格式为 `@for <variable> from <expression> to <expression> { ... }` ------ 不包含 最后一个
或者为 `@for <variable> from <expression> through <expression> { ... }` - 包含 最后一个
作用：从一个数字向上或者向下计数到另一个数字
区别：to不包含最后的数字，through包含最后的数字
---

@for $i from 1 through 4 { // 包含1-4个p都加上红色，to不包含最后一个
  p:nth-child(#{$i}) {
    background: red;
  }
}
```

```
8
math.div($number1, $number2)
- 除法：返回 $number1 除以 $number2 的结果
- division 是除法的意思
---

@debug math.div(1, 2); // 0.5
@debug math.div(100px, 5px); // 20      单位相同
@debug math.div(100px, 5); // 20px      没有单位时
@debug math.div(100px, 5s); // 20px/s   单位不同时
```

```map相关
9
map相关
--
Sass中的Maps包含一对键值对，使得通过键查找值很容易
格式为：(<expression>: <expression>, <expression>: <expression>)
空map：用 () 表示
空列表即空数组：用 () 表示
Maps允许使用任何Sass值作为键
---
map-get($map, $key) ----------- 取出指定的值
map-remove($map, $key) -------- 移除指定的值
map-has-key($map,$key --------- 查看值是否存在
map-merge($map1, $map2) ------- 合并多个map
---

9.1 查值
map-get($map, $key)
$font-weights: ("regular": 400, "medium": 500, "bold": 700);
@debug map-get($font-weights, "medium"); // 500
@debug map-get($font-weights, "extra-bold"); // null

$font-weights: ("regular": 400, "medium": 500, "bold": 700);
.p { font-weight: map-get($font-weights, bold); } // 700



9.2 遍历
@each var in <list>|<map>
所以 @each是可以遍历map的
$icons: ("eye": "\f112", "start": "\f12e", "stop": "\f12f");
@each $name, $glyph in $icons { // 定义两个变量，相当于 key value
  .icon-#{$name}:before {
    content: $glyph;
  }
} 编译为
.icon-eye:before { content: "\f112"; }
.icon-start:before {content: "\f12e"; }
.icon-stop:before { content: "\f12f"; }


9.3 添加元素
map-merge($map1, $map2)
- 相同的键：如果两个map具有相同的键，则返回第二个键所对应的值
- 返回新的map：由于Sass中的map是`不可变的`，`map-merge()`不会修改原始列表，所以 Sass的map函数都返回新的map，而不是修改原始的map


9.4 是否存在元素
map-has-key($map,$key)
- 返回一个布尔值
- 当 $map 中有这个 $key，则函数返回 true，否则返回 false
```

```@if ... @else
10
@if
@if ... @else if ... @else
当 `@if` 的表达式返回值不是 `false` 或者 `null` 时，条件成立，输出 `{}` 内的代码
---
$type: monster;
p {
  @if $type == ocean {
    color: blue;
  } @else if $type == matador {
    color: red;
  } @else {
    color: black;
  }
}
```

```@function
11
@function
@function ... @return
Sass 支持自定义函数，并能在任何属性值或 Sass script 中使用
---

$grid-width: 40px;
@function grid-width($n) { // -------------- 声明函数
  @return $n * $grid-width;
}

#sidebar { width: grid-width(5); } // ------ 调用函数
结果为
#sidebar { width: 200px }
```

```@extend
12
@extend
- 作用：继承样式
- 解决：
  - 不使用@extend：如果不使用继承，在htlm中需要添加两个class，<div class="error seriousError">
  - 使用@extend: <div class="seriousError">
- 区别
  - @extend 和 @mixin 的区别？
    - @mixin 可以传参
    - 编译后的样式不一样
- 官网教程
  - 7.3 https://www.sass.hk/docs/
---

.error {
  border: 1px #f00;
  background-color: #fdd;
}
.seriousError {
  @extend .error;
  border-width: 3px;
}
编译为
.error, .seriousError {
  border: 1px #f00;
  background-color: #fdd;
}
.seriousError {
  border-width: 3px;
}
```

```@use 和 @import 的区别
13
@use 和 @import 的区别
---

1. @import 的缺点
- 多次导入，样式会重复加载
- 没有命名空间
- 没有私有函数

2. @use
- (1) 只导入一次：该文件只会 ( 导入一次 )，即使在项目中多次使用了 @use
- (2) 私有：( 下划线_ ) 和 ( 连字符- ) 开头的 ( var，mixin，function ) 是 ( 私有的 )，不会导入
- (3) 命名空间：@use as 命名空间的名称
```

```@import '~@/aa/bb'
14
@import '~@/aa/bb'
---

- 变量: 当 @import 的路径中包含 ~ 时，表示的后面是一个变量
- 查找顺序：该变量首先会去 ( webpack 的 resolve.alias 中查找 )，没有才会去 ( node_modules ) 中查找
- 链接：https://segmentfault.com/q/1010000010879017
```

```可变参数
15
可变参数
@function 和 @mixin 中的 ( 可变参数 )
---

@mixin animate($name, $time, $mode, $delay) {
  transition: $name $time $mode $delay;
}
等价于
@mixin animate($args...) {
  transition: $args;
}

---
使用
div {
  @include animate(all, 4s, linear, 0s);
}
```

## (2) 颜色函数

- red() green() blue()
- rgb() rgba()
- mix()

```
rgb($red,$green,$blue)：根据红、绿、蓝三个值创建一个颜色；
rgba($red,$green,$blue,$alpha)：根据红、绿、蓝和透明度值创建一个颜色；// rgba 分别表示 red green blue alpha

mix($color-1,$color-2,[$weight])：把两种颜色混合在一起

red($color)：从一个颜色中获取其中红色值；
green($color)：从一个颜色中获取其中绿色值；
blue($color)：从一个颜色中获取其中蓝色值；
---

1
mix
- Mix函数是将两种颜色根据一定的比例混合在一起，生成另一种颜色
- 官网 https://www.sass.hk/skill/sass25.html
- mix($color-1,$color-2,$weight);
  - 权重
    - 默认: 默认权重是50%，表示各占一半
    - 25%: 表示第一个颜色所占比例为25%
    - background: mix(red, white, 70%);
```
