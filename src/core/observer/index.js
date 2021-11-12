/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}


/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
// ------------------------------------------------------------- Observer
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    // 1
    // def
    // export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
    //   Object.defineProperty(obj, key, {
    //     value: val,
    //     enumerable: !!enumerable,
    //     writable: true,
    //     configurable: true
    //   })
    // }
    // 2
    // def的作用
    // - 给 data 添加 __ob__ 属性，值是 observer 实例
    // - data.__ob__ = observer
    if (Array.isArray(value)) {
      if (hasProto) {
        // 1
        // hasProto
        // export const hasProto = '__proto__' in {}
        // 表示该环境中存在 __proto__属性，说明是浏览器环境
        // 2
        // in
        // 'name' in { name: 'woow_wu7' }
        // 作用：in 用来判断 对象中是否包含某个属性
        // 注意：in判断的是 ( 自身属性 + 继承的属性 )
        // 对比：Object.keys() Object.getOwnPropertyNames() for...in 和 property in object
        // 3
        // function protoAugment (target, src: Object) {
        //   target.__proto__ = src
        // }
        // 3.1
        // const arrayProto = Array.prototype
        // export const arrayMethods = Object.create(arrayProto)
        // 上面的 3.1 表示：创建一个 plainArray 实例
        // 3.2
        // const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
        // - 注意：Object.getOwnPropertyNames() 获取 ( 自身属性 + 可枚举属性 + 不可枚举属性 )
        // 4
        // function copyAugment (target: Object, src: Object, keys: Array<string>) {
        //   for (let i = 0, l = keys.length; i < l; i++) {
        //     const key = keys[i]
        //     def(target, key, src[key])
        //   }
        // }
        protoAugment(value, arrayMethods)
      } else {
        // 不存在 {}.__proto__
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      // value 不是数组，则 观测对象
      // - 说明 value 是一个对象
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * // 该函数在 参数 是一个 对象 时调用
   * // walk 是遍历所有属性，并转换 getter 和 setter 函数
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * 试图为value创建一个observer实例
 * returns the new observer if successfully observed,
 * 如果观测成功就会返回一个新的 observer 实例
 * or the existing observer if the value already has one.
 * 如果value已经存在，就返回存在的 observer
 */
// observe(data, true /* asRootData */)
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    // 如果 value 不是一个对象 或者 是一个 VNode，则直接返回
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // data存在 __ob__ 属性 并且 value.__ob__是一个observer对象
    // 即已经观测过了, 直接赋值
    ob = value.__ob__
  } else if (
    // 未观察过
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    // 如果是根data即new Vue()初始化的时候传入的data 并且 ob 存在
    // vmCount++
    // 即统计被生成的次数
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 定义响应式属性
 */
// defineReactive(obj, keys[i])
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep() // data中的每一个属性都会对应一个 dep 实例

  const property = Object.getOwnPropertyDescriptor(obj, key)
  // Object.getOwnPropertyDescriptor(obj, key)
  // - 作用：获取 obj 对象中 key 属性对应的 ( 属性描述对象 )

  if (property && property.configurable === false) {
    return
    // 如果该属性 对应的 属性描述对象不能被修改，该属性不能被删除的话，直接返回
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
