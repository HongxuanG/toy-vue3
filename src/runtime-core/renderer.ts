import { ShapeFlags, isOn, isFunction } from '../shared'
import { createComponentInstance, setupComponent } from './component'
import { Fragment, Text } from './vnode'

export function render(vnode: any, container: any) {
  // 做patch算法
  patch(vnode, container, undefined)
}

// 例如：
/**
 * template被编译成  {...., setup(){}, render(){}, ....}  这样一个特殊对象
 * 或者{..., data, methods, render(){}, ...}
 *
 * 之后 这个特殊对象作为参数会传入 createVNode()  创建虚拟dom
 */
// 传入vnode，递归对一个组件或者普通元素进行拆箱，在内部对vnode的type判断执行不同的处理函数

function patch(vnode: any, container: any, parentComponent: any) {
  // 检查是什么类型的vnode
  const { type } = vnode
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent)
      break
    case Text:
      processText(vnode, container)
      break
    default: {
      // & 左右两边同时为1 则为1   可以应用在 0001 & 0010 判断指定的位置是否为1  这个案例会输出0000  所以为false 指定的位置并没有相同
      if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
        // 是一个普通元素？处理vnode是普通标签的情况
        processElement(vnode, container, parentComponent)
      } else if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 是一个组件？处理vnode是组件的情况
        processComponent(vnode, container, parentComponent)
      }
      break
    }
  }
}
function processText(vnode: any, container: any) {
  mountText(vnode, container)
}
function processFragment(vnode: any, container: any, parentComponent: any) {
  mountChildren(vnode, container, parentComponent)
}
// 处理组件的情况
function processComponent(vnode: any, container: any, parentComponent: any) {
  mountComponent(vnode, container, parentComponent)
}
// 处理元素的情况
function processElement(vnode: any, container: any, parentComponent: any) {
  mountElement(vnode, container, parentComponent)
}
// 最后，它把setup()的返回值挂载在组件的instance的setupState上
// instance.type的render()函数挂载在组件的instance的render上
function mountComponent(vnode: any, container: any, parentComponent: any) {
  const instance = createComponentInstance(vnode, parentComponent)
  // 安装组件
  setupComponent(instance)

  //
  setupRenderEffect(instance, vnode, container)
}
function mountElement(vnode: any, container: any, parentComponent: any) {
  // 注意：这个vnode并非是组件的vnode，而是HTML元素的vnode
  const el = (vnode.el = document.createElement(vnode.type) as HTMLElement)
  let { children, props } = vnode
  // 子节点是文本节点
  if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children
    // 子节点是数组
  } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el, parentComponent)
  }
  let val: any
  // 对vnode的props进行处理，把虚拟属性添加到el
  for (let key of Object.getOwnPropertyNames(props).values()) {
    val = props[key]
    if (Array.isArray(val)) {
      el.setAttribute(key, val.join(' '))
    } else if (isOn(key) && isFunction(val)) {
      // 添加事件
      el.addEventListener(key.slice(2).toLowerCase(), val)
    } else {
      el.setAttribute(key, val)
    }
  }
  container.append(el)
}
function mountText(vnode: any, container: any) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  container.append(textNode)
}
function mountChildren(vnode: any, container: any, parentComponent: any) {
  vnode.children.forEach((vnode: any) => {
    patch(vnode, container, parentComponent)
  })
}
function setupRenderEffect(instance: any, vnode: any, container: any) {
  // 这个render()已经在finishComponentSetup处理过了，就是 instance.type.render() 特殊对象的render()
  // render函数内部的this指向 修改为 setupStatefulComponent中定义的proxy对象
  const subTree = instance.render.call(instance.proxy)
  // 对子树进行拆箱操作 递归进去
  patch(subTree, container, instance)
  // 代码到了这里，组件内的所有element已经挂在到document里面了
  vnode.el = subTree.el
}
