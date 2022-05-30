/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.

// ----------------------------------------------------------------------
// createCompilerCreator
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string, // 模版，el和template都转成template
  options: CompilerOptions
): CompiledResult {

  // 1
  // parse
  // - 主要作用：将 template 转成 ast 抽象语法树
  const ast = parse(template.trim(), options)

  // 2
  // optimize
  // - 主要作用：将 ( 静态节点和静态根节点 ) 打上标记
  // - 整个过程：template(HTML) -> AST -> render -> Vnode -> patch ( diff对比+生成真实DOM )
  // - 具体优化：
  //   - 因为 ( 静态节点和静态根节 )点不会变化，所以是 ( 不需要做diff算法比对 ) 的，所以不做diff，提升性能
  //   - 具体就是两点
  //     - 1. 在AST中找出所有静态节点并打上标记；
  //     - 2. 在AST中找出所有静态根节点并打上标记；
  if (options.optimize !== false) {
    optimize(ast, options)
  }

  // 3
  // generate
  // - 主要作用就是：将 AST 生成一个 render 函数，共挂载时调用
  const code = generate(ast, options)

  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
