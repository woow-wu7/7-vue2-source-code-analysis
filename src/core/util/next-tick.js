/* @flow */
/* globals MutationObserver */

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false
// isUsingMicroTask
// 标志位，表示是否使用 微任务队列

const callbacks = []
// callbacks
// 存放nextTick的参数回调函数
// 是这样的一个数组
// 1. Vue.nextTick 中的第一个参数cb存在  --------------------> [() => {cb.call(ctx)}]
// 2. Vue.nextTick 中的第一个参数cb不存在，但支持promise -----> [() => {_resolve(ctx)}]

let pending = false
// pending
// 标志位，同一时间只能执行 timerFunc 函数一次

function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0) // 浅拷贝
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) { // 执行 callbacks 中的所有函数
    copies[i]()
  }
}

// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).



// ======================================================================================
let timerFunc
// timerFunc
// 是一个逐渐降级的过程：Promise -> MutationObserver -> setImmediate -> setTimeout
//  timerFunc = () => { Promise.resolve().then(flushCallbacks) }
//  timerFunc = () => { counter = (counter + 1) % 2 textNode.data = String(counter) }
//  timerFunc = () => { setImmediate(flushCallbacks) }
//  timerFunc = () => { setTimeout(flushCallbacks, 0) }
// ======================================================================================



// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
// -------------------------------------------------------------------------- 1. Promise
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
// -------------------------------------------------------------------------- 2. MutationObserver
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
// -------------------------------------------------------------------------- 3. setImmediate
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
// -------------------------------------------------------------------------- 4. setTimeout
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

// nextTick
export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    // push 一个 ( 匿名函数 ) 进 callbacks 队列
    // 内部用 try...catch 包装，那么每个函数执行报错不会影响整个程序的继续执行
    if (cb) {
      try {
        cb.call(ctx) // 调用cb
      } catch (e) {
        handleError(e, ctx, 'nextTick') // 错误处理
      }
    } else if (_resolve) {
      // _resolve 是用来处理promise类型的nextTick
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
    // -------------------------------- 执行 timerFunc()
    // timerFunc
    // 是一个逐渐降级的过程：Promise -> MutationObserver -> setImmediate -> setTimeout
    //  timerFunc = () => { Promise.resolve().then(flushCallbacks) }
    //  timerFunc = () => { counter = (counter + 1) % 2 textNode.data = String(counter) }
    //  timerFunc = () => { setImmediate(flushCallbacks) }
    //  timerFunc = () => { setTimeout(flushCallbacks, 0) }
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
