// type是 <template></template>经过编译之后具有render()函数的对象，此外还有__file和__hmrId这些无关的属性
export function createVNode(type: any, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children,
    el: null
  }
  return vnode
}
