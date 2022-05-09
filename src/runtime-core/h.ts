import { createVNode } from './vnode'

export function h(type: any, props?: any, children?: any) {
  createVNode(type, props, children)
}
