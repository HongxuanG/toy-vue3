# Toy-Vue3.x

手写 vue3 核心源码，理解其原理 by myself

## 🙌 目的

读懂 Vue3 源码可能是 2022 年要进大厂的必经之路了。

但是直接阅读源码的难度非常大，因为除了核心逻辑以外框架本身还要处理很多 edge case(边缘情况) 、错误处理、热更新等一系列工程问题。

为了学习源码，提高自己对 vue3 的理解，能在开发中规避一些不必要的 bug 以及迅速给出项目的优化方案，因此创建这个 repo。

## ✏ 吸取知识就要输出文章

掘金专栏

[Vue3 核心原理代码解构](https://juejin.cn/user/493015847938664/columns)

## 🛠 功能清单
reactivity部分

- [x] 实现 effect & reactive 依赖收集和依赖触发
- [x] 实现 effect 返回 runner
- [x] 实现 effect 的 scheduler 功能
- [x] 实现 effect 的 stop 功能
  - [x] 优化 stop 功能
- [x] 实现 readonly 功能
- [x] 实现 isReactive 和 isReadonly 功能
- [x] readonly 和 reactive 嵌套对象功能
- [x] 实现 shallowReadonly 功能
- [x] 实现 shallowReactive 功能
- [x] 实现 isProxy 功能
- [x] 实现 isShallow 功能
- [x] 实现 ref 功能
- [x] 实现 isRef 和 unRef 功能
- [x] 实现 proxyRefs 功能
- [x] 实现 computed 计算属性功能


runtime-core部分

- [x] 实现初始化 component 主流程
- [x] 实现初始化 element 主流程  （通过递归patch拆箱操作，最终都会走向mountElement这一步）
- [x] 实现组件代理对象  （instance.proxy解决`render()`函数的this指向问题）
- [ ] 实现 shapeFlags
- [ ] 实现注册事件功能
- [ ] 实现组件 props 功能
- [ ] 实现组件 emit 功能
- [ ] 实现组件 slots 功能
- [ ] 实现 Fragment 和 Text 类型节点
- [ ] 实现 getCurrentInstance
- [ ] 实现 provide-inject 功能
- [ ] 实现自定义渲染器 custom renderer
- [ ] 更新 element 流程搭建
- [ ] 更新 element 的 props
- [ ] 更新 element 的 children
- [ ] 更新 element 的双端对比 diff 算法
- [ ] 实现组件更新功能
