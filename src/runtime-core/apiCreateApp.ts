import { createVNode } from './vnode'

export function createAppAPI(render: any) {
  return function createApp(rootComponent: any) {
    const mount = (rootContainer: any) => {
      const vnode = createVNode(rootComponent)

      render(vnode, rootContainer)
    }
    return {
      mount,
    }
  }
}
