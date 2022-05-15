import { isArray, isObject, isString } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

// type是 <template></template>经过编译之后具有render()函数的对象，此外还有__file和__hmrId这些无关的属性
export function createVNode(type: any, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
  }
  normalizeChildren(vnode, children)
  return vnode
}
// 根据vnode.type标志vnode类型
function getShapeFlag(type: any) {
  return isString(type) 
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0
}
// 给vnode.shapeFlag追加标识
function normalizeChildren(vnode: any, children: any){
  // | 左右两边为0 则为0   可以用于给二进制指定的位数修改成1  例如：0100 | 0001 = 0101
  // 在这里相当于给vnode追加额外的标识
  if(isString(children)){
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
    // 子级是数组
  } else if(isArray(children)){
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }
  // vnode是组件
  if(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT){
    // 子级是对象
    if(isObject(children) ){
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    }
  }
}
export function createTextVNode(text: string){
  return createVNode(Text, {}, text)
}
