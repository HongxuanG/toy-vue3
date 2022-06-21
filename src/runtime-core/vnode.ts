import { isArray, isObject, isString } from '../shared'
import { ShapeFlags } from '../shared/shapeFlags'

// fragment用来创建一个碎片组件，这个碎片组件并不会真正的渲染出一个<Fragment></Fragment>
// 他的作用就是渲染slots的时候摆脱div的包裹，让slots直接渲染在父组件上。
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

// type是 <template></template>经过编译之后具有render()函数的对象，此外还有__file和__hmrId这些无关的属性
export function createVNode(type: any, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children,
    key: props && props.key,
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
// 创建文本虚拟节点 为什么需要创建文本虚拟节点？直接填上文本不行吗？h('div',{},[Foo, '我是文本'])
// 挂载html的时候因为children是数组，必然经过mountChildren的循环，然后patch，单纯填上文本是没办法渲染出来的
// 因为patch并没有针对纯文本做处理，你只能通过div（或者其他html元素）包裹起来生成一个vnode才行，像这样：h('div',{},[Foo, h('div',{}, '我是文本')])
export function createTextVNode(text: string){
  return createVNode(Text, {}, text)
}
