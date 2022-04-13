/* @flow */

import { isRegExp, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'

type CacheEntry = {
  name: ?string;
  tag: ?string;
  componentInstance: Component;
};

type CacheEntryMap = { [key: string]: ?CacheEntry };

function getComponentName (opts: ?VNodeComponentOptions): ?string {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function pruneCache (keepAliveInstance: any, filter: Function) {
  const { cache, keys, _vnode } = keepAliveInstance
  for (const key in cache) {
    const entry: ?CacheEntry = cache[key]
    if (entry) {
      const name: ?string = entry.name
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}

// pruneCacheEntry
// - 主要作用：就是从内存中删除最不常用的组件
function pruneCacheEntry (
  cache: CacheEntryMap,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const entry: ?CacheEntry = cache[key]
  if (entry && (!current || entry.tag !== current.tag)) {
    entry.componentInstance.$destroy() // 卸载组件
  }
  cache[key] = null // 删除缓存的组件
  remove(keys, key) // 删除 key，keys是用来标记是否常用的手段
}

const patternTypes: Array<Function> = [String, RegExp, Array]

export default {
  name: 'keep-alive',
  abstract: true,
  // abstract: true,
  // - 抽象组件的标志，即 keep-alive 是一个抽象组件
  // - 抽象组件的 ( 特点 )
  //  - 1. 自身不会渲染成 DOM ----------- 即不会渲染到页面上
  //  - 2. 也不会出现在组件的父组件链中 --- 即不会和 ( keep-alive的父组件 ) 和 ( keep-alive的子组件 ) 建立两个父子关系
  // - 原理
  //   - 问题：抽象组件是如何实现 - 不在父组件链中的呢
  //   - 回答：在 ( 初始化阶段 ) 会调用 ( initLifecycle )，会去判断 ( 父组件是否为抽象组件 )，如果是抽象组件就选取 ( 抽象组件的上一层 ) 作为父级，即忽略抽象组件和父组件，抽象组件和子组件的层级关系
  //   - 简化：就是如果是抽象组件，就把抽象组件的 - 父组件作为子组件的父组件
  // - 常见的抽象组件：<keep-alive> <transition>

  // 3 个 props
  props: {
    include: patternTypes,
    // include可以是
    // - 逗号分隔的字符串，比如 ----- <keep-alive include="a,b">
    // - 正则表达式，比如 --------- <keep-alive :include="/a|b/">
    // - 数组，比如 --------------- <keep-alive :include="['a', 'b']">
    // - 官网说明：https://cn.vuejs.org/v2/api/#keep-alive
    // - 使用详见1 https://github.com/woow-wu7/7-keep-alive
    // - 使用详见2 https://github.com/woow-wu7/vue2-research/blob/master/src/views/KeepAlive.vue
    exclude: patternTypes,
    max: [String, Number]
  },

  methods: {
    // cacheVNode
    // - 在 mounted 时被调用
    // - 在 updated 是也被调用
    cacheVNode() {
      const { cache, keys, vnodeToCache, keyToCache } = this
      if (vnodeToCache) {
        const { tag, componentInstance, componentOptions } = vnodeToCache
        cache[keyToCache] = {
          name: getComponentName(componentOptions), // 组件名
          tag, // tag
          componentInstance, // 组件实例
        }
        // cache
        // - key -> keyToCache
        // - value -> 组装的组件对象

        keys.push(keyToCache)

        // prune oldest entry
        // 删掉最古老的条目
        // LRU 缓存策略执行的时机，max存在，并且大于了max
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
        this.vnodeToCache = null
      }
    }
  },

  created () {
    this.cache = Object.create(null)
    // cache
    // - cache对象，用来缓存 vnode
    // - LRU：
    //  - 最近最少使用的缓存策略
    //  - keep-alive 使用的是 least recently used 最近最少使用的缓存策略
    //  - 详见：https://juejin.cn/post/6862206197877964807

    this.keys = [] // vnode 的 key
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    this.cacheVNode()
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  updated () {
    this.cacheVNode()
  },

  render () {
    const slot = this.$slots.default

    const vnode: VNode = getFirstComponentChild(slot) // 获取 slot 中的第一个 ( 组件vnode )

    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions // 获取组件配置项

    if (componentOptions) {
      // check pattern
      // 检查模式
      const name: ?string = getComponentName(componentOptions) // 获取组件的 name 属性
      const { include, exclude } = this
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        // 组件名与include不匹配或与exclude匹配都会直接退出并返回 VNode，不走缓存机制
        return vnode
      }

      const { cache, keys } = this
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key

      if (cache[key]) { // -- 组件已经缓存过
        vnode.componentInstance = cache[key].componentInstance // 直接获取缓存的组件的 vnode.componentInstance
        // make current key freshest
        // 确保当前的key是最新的，即 LRU 最近最少使用缓存策略
        remove(keys, key) // ------- 1. 删除 keys 数组中的 key
        keys.push(key) // ---------- 2. 删除后，把该 key 放在 keys 数组的 ( 尾部 )，即 LRU 最近最少使用的缓存策略
      } else { // ----------- 组件未缓存过
        // delay setting the cache until update
        // 延迟设置缓存，直到更新
        this.vnodeToCache = vnode // 供 cacheVNode 方法使用
        this.keyToCache = key // 供 cacheVNode 方法使用
      }

      vnode.data.keepAlive = true // 添加组件的data中，添加标志位 keepAlive
    }
    return vnode || (slot && slot[0]) // 返回第一个组件，或者 slot，或者 slot[0]，逐渐降级
  }
}
