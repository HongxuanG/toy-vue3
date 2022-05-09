// template渲染成真实dom的大致流程：
// <template></template>
// 1. 经过编译               -> 具有render()的对象
// 2. 经过createVNode()     -> vnode对象
// 3. 经过mountElement()    -> DOM
// 4. 插入到                 -> root的#app
export { createApp } from './createApp'
export { h } from './h'
