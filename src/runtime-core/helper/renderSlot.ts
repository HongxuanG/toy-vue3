import { createVNode, Fragment } from '../vnode'
// slots已经在initSlots中做了处理（把slots挂载到instance.slots上）
export function renderSlot(slots: any, name: string = 'default', props: any) {
  const slot = slots[name]
  console.log('slot==>', slots, slot)
  if (slot) {
    // if(typeof slot === 'function'){

    // slots有可能是对象，数组
    // 但是这里额外渲染了一层div，怎么去解决呢？定义一个vnode.type叫Fragment，内部只处理children
    // 就好像走了processElement()逻辑一样，不用的是他不会给Fragment生成HTML元素节点
    // return createVNode('div', {}, slot(props))
    // return createVNode(Fragment, {}, slot(props))
    return createVNode(Fragment, {}, slot)
    // }
  } else {
    return slots
  }
}
