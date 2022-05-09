import { createComponentInstance, setupComponent } from './component'
export function render(vnode: any, container: HTMLElement){
  
  // 做patch算法
  patch(vnode, container)
}

// 例如：
/**
 * template被编译成  {...., setup(){}, render(){}, ....}  这样一个特殊对象
 * 或者{..., data, methods, render(){}, ...}
 * 
 * 之后 这个特殊对象作为参数会传入 createVNode()  创建虚拟dom 
 * 
 * 
 */
// 传入vnode，递归对一个组件或者普通元素进行拆箱，在内部对vnode的type判断执行不同的处理函数

function patch(vnode: any, container: HTMLElement) {
  // 检查是什么类型的vnode

  // 是一个普通元素？
  // processElement()


  // 是一个组件？
  // 目前只有一个component所以这里不做区分直接processComponent
  processComponent(vnode, container)
}
function processComponent(vnode: any, container: HTMLElement) {
  mountComponent(vnode, container)
}
// 最后，它把setup()的返回值挂载在组件的instance的setupState上
// instance的type的render()函数挂载在组件的instance的render上
function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode)
  // 安装组件
  setupComponent(instance)

  //
  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container: any) {
  // 这个render()已经在finishComponentSetup处理过了，就是 instance.type.render() 特殊对象的render()
  const subTree = instance.render()
  // 对子树进行拆箱操作
  patch(subTree, container)
}
