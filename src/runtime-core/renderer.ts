import { effect } from '../reactivity'
import { ShapeFlags, EMPTY_OBJ } from '../shared'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { Fragment, Text } from './vnode'

interface RendererOptions {
  createElement: (type: string) => any
  patchProp: (el: any, key: string, oldValue: any, newValue: any) => void
  insert: (el: any, container: any, anchor?: any) => void
  remove: (el: any) => void
  setElementText: (el: any, text: string) => void
}

export function createRenderer(options: RendererOptions) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options

  function render(vnode: any, container: any) {
    // 做patch算法
    patch(null, vnode, container, null, null)
  }

  // 例如：
  /**
   * template被编译成  {...., setup(){}, render(){}, ....}  这样一个特殊对象
   * 或者{..., data, methods, render(){}, ...}
   *
   * 之后 这个特殊对象作为参数会传入 createVNode()  创建虚拟dom
   */
  // 传入vnode，递归对一个组件或者普通元素进行拆箱，在内部对vnode的type判断执行不同的处理函数
  // n1是老的vnode，n2是新的vnode
  function patch(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    // 检查是什么类型的vnode
    const { type } = n2
    switch (type) {
      // 这里有个面试题就是：为什么vue2书写template的时候要一个根元素，而vue3不用根元素？
      // 那是因为有fragment的原因：不再重新生成一个div去包裹template里的元素，而是直接patch children
      case Fragment:
        processFragment(n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n2, container)
        break
      default: {
        // & 左右两边同时为1 则为1   可以应用在 0001 & 0010 判断指定的位置是否为1  这个案例会输出0000  所以为false 指定的位置并没有相同
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          // 是一个普通元素？处理vnode是普通标签的情况
          processElement(n1, n2, container, parentComponent, anchor)
        } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 是一个组件？处理vnode是组件的情况
          processComponent(n2, container, parentComponent, anchor)
        }
        break
      }
    }
  }
  function processText(n2: any, container: any) {
    mountText(n2, container)
  }
  function processFragment(
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    mountChildren(n2.children, container, parentComponent, anchor)
  }
  // 处理组件的情况
  function processComponent(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    mountComponent(vnode, container, parentComponent, anchor)
  }
  // 处理元素的情况
  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }
  // 最后，它把setup()的返回值挂载在组件的instance的setupState上
  // instance.type的render()函数挂载在组件的instance的render上
  function mountComponent(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const instance = createComponentInstance(vnode, parentComponent)
    // 安装组件
    setupComponent(instance)

    // 对render函数进行依赖收集
    setupRenderEffect(instance, vnode, container, anchor)
  }
  function mountElement(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    // 注意：这个vnode并非是组件的vnode，而是HTML元素的vnode
    const el = (vnode.el = hostCreateElement(vnode.type) as HTMLElement)
    let { children, props } = vnode
    // 子节点是文本节点
    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children
      // 子节点是数组
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor)
    }
    let val: any
    // 对vnode的props进行处理，把虚拟属性添加到el
    for (let key of Object.getOwnPropertyNames(props).values()) {
      val = props[key]
      hostPatchProp(el, key, null, val)
    }
    // insert操作
    hostInsert(el, container, anchor)
  }
  // 对比element
  function patchElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    console.log('patchElement')
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    // 为什么这里n1的el对象要赋值给n2的el？
    // 因为第一次挂载的时候调用patch，走的mountElement，内部给vnode的el赋值了
    // 而往后的patch都不会走mountElement，而是走patchElement，内部并没有给新的vnode的el赋值，所以这里是属于补救的措施。
    const el = (n2.el = n1.el)
    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }
  function patchChildren(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const prevShapeFlag = n1.shapeFlag
    const newShapeFlag = n2.shapeFlag
    const c1 = n1.children
    const c2 = n2.children
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(container)
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      // text to array
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(c2, container, parentComponent, anchor)
      } else {
        console.log('array to array')
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }
  // c1是旧节点的子节点数组
  // c2是新节点的子节点数组
  function patchKeyedChildren(
    c1: any,
    c2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    let i = 0
    let l2 = c2.length
    // 指针1
    let e1 = c1.length - 1
    // 指针2
    let e2 = l2 - 1
    // 判断是否相同vnode节点
    function isSameVNodeType(n1: any, n2: any) {
      return n1.type === n2.type && n1.key === n2.key
    }
    // 左端对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      i++
    }
    console.log(i)
    // 右端对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, anchor)
      } else {
        break
      }
      e1--
      e2--
    }
    console.log('e1', e1)
    console.log('e2', e2)
    // 旧的节点数组没有，新的节点数组有（新增）
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < l2 ? c2[nextPos].el : null

        while (i <= e2) {
          // 新增
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    }
  }
  function unmountChildren(child: any) {
    for (let i = 0; i < child.length; i++) {
      hostRemove(child[i])
    }
  }
  // 对比props
  function patchProps(el: any, oldProps: any, newProps: any) {
    // 相同的props没必要比较
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const newProp = newProps[key]
        const oldProp = oldProps[key]
        if (newProp !== oldProp) {
          hostPatchProp(el, key, oldProp, newProp)
        }
      }
      // 老props是空对象就没必要循环
      if (oldProps !== EMPTY_OBJ) {
        for (let key in oldProps) {
          // 新的props没有该属性
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }
  function mountText(vnode: any, container: any) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.append(textNode)
  }
  function mountChildren(
    children: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    children.forEach((vnode: any) => {
      patch(null, vnode, container, parentComponent, anchor)
    })
  }
  function setupRenderEffect(
    instance: any,
    vnode: any,
    container: any,
    anchor: any
  ) {
    effect(() => {
      // 通过一个变量isMounted区分是初始化还是更新
      if (!instance.isMounted) {
        // 这个render()已经在finishComponentSetup处理过了，就是 instance.type.render() 特殊对象的render()
        // render函数内部的this指向 修改为 setupStatefulComponent中定义的proxy对象
        const subTree = instance.render.call(instance.proxy)
        instance.subTree = subTree
        // 对子树进行拆箱操作 递归进去
        console.log('subTree===>', subTree)
        patch(null, subTree, container, instance, anchor)
        // 代码到了这里，组件内的所有element已经挂在到document里面了
        vnode.el = subTree.el
        instance.isMounted = true
      } else {
        console.log('updated')
        const subTree = instance.render.call(instance.proxy)
        const prevSubTree = instance.subTree
        instance.subTree = subTree
        patch(prevSubTree, subTree, container, instance, anchor)
      }
    })
  }
  return {
    createApp: createAppAPI(render),
    render,
  }
}
