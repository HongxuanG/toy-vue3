import { createVNode } from "../vnode";
// slots已经在initSlots中做了处理（把）
export function renderSlots(slots: any, name: string, props: any){
  const slot = slots[name]
  if (slot){
    if(typeof slot === 'function'){

      // slots有可能是对象，数组
      return createVNode('div', {}, slot(props))
    }
  }
}
