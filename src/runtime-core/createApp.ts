import { render } from "./renderer"
import { createVNode } from "./vnode"



export function createApp(rootComponent: any){
  const mount = (rootContainer: HTMLElement)=>{
    const vnode = createVNode(rootComponent)

    render(vnode, rootContainer)
  }
  return {
    mount
  }
}