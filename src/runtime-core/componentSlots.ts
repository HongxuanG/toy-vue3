import { isArray, ShapeFlags } from '../shared'
// 如果children里面有slot，那么把slot挂载到instance上
export function initSlots(instance: any, children: any) {
  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(instance.slots, children)
  }
}
// 把数组类型的slots 转成对象 具名name作为instance.slots的属性名，属性值是vnode
function normalizeObjectSlots(slots: any, children: any) {
  console.log('slots children===>' ,children)
  for (let key in children) {
    const value = children[key]

    // slots[key] = (props: any) => normalizeSlotValue(value(props))
    slots[key] = normalizeSlotValue(value)
  }
  // slots = normalizeSlotValue(slots)
}
function normalizeVNodeSlots(slots: any, children: any){
  
}
function normalizeSlotValue(value: any) {
  return isArray(value) ? value : [value]
}
