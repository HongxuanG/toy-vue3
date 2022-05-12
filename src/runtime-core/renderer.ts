import { isObject, isString } from '../shared'
import { createComponentInstance, setupComponent } from './component'
export function render(vnode: any, container: any) {
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

function patch(vnode: any, container: any) {
  // 检查是什么类型的vnode
  console.log('vnode', vnode.type)
  if (isString(vnode.type)) {
    // 是一个普通元素？处理vnode是普通标签的情况
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
    // 是一个组件？处理vnode是组件的情况
    // 目前只有一个component所以这里不做区分直接 processComponent
    processComponent(vnode, container)
  }
}
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}
function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}
// 最后，它把setup()的返回值挂载在组件的instance的setupState上
// instance.type的render()函数挂载在组件的instance的render上
function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode)
  // 安装组件
  setupComponent(instance)

  //
  setupRenderEffect(instance,vnode, container)
}
function mountElement(vnode: any, container: any) {
  // 注意：这个vnode并非是组件的vnode，而是HTML元素的vnode
  console.log('mountElement', vnode)
  const el = (vnode.el = document.createElement(vnode.type) as HTMLElement)
  let { children, props } = vnode
  if (isString(children)) {
    el.textContent = children
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el)
  }
  // 对vnode的props进行处理，把虚拟属性添加到el
  for (let key of Object.getOwnPropertyNames(props).values()) {
    if (Array.isArray(props[key])) {
      el.setAttribute(key, props[key].join(' '))
    } else {
      el.setAttribute(key, props[key])
    }
  }
  container.append(el)
}
function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((vnode: any) => {
    console.log('mountChildren==>', vnode)
    patch(vnode, container)
  })
}
function setupRenderEffect(instance: any,vnode: any, container: any) {
  console.log(instance)
  // 这个render()已经在finishComponentSetup处理过了，就是 instance.type.render() 特殊对象的render()
  // render函数内部的this指向 修改为 setupStatefulComponent中定义的proxy对象
  const subTree = instance.render.call(instance.proxy)
  // 对子树进行拆箱操作
  patch(subTree, container)
  // 到了这里，组件内的所有element已经挂在到document里面了
  vnode.el = subTree.el
}
