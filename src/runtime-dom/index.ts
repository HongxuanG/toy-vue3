import { createRenderer } from '../runtime-core/renderer'
import { isFunction, isOn } from '../shared'

// 创建元素
export function createElement(type: any) {
  return document.createElement(type)
}
// 处理props
export function patchProp(el: any, key: string, oldValue: any, newValue: any) {
  if (Array.isArray(newValue)) {
    el.setAttribute(key, newValue.join(' '))
  } else if (isOn(key) && isFunction(newValue)) {
    // 添加事件
    el.addEventListener(key.slice(2).toLowerCase(), newValue)
  } else {
    // props属性的属性值是undefined或者null，删除该属性
    if (newValue === null || newValue === undefined) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, newValue)
    }
  }
}
// 插入元素
export function insert(el: any, container: any) {
  container.append(el)
}
// 通过对以上函数的抽离，方便实现了自定义渲染器的逻辑
// 以后想自定义渲染器，传入三个函数即可
const render = createRenderer({
  createElement,
  patchProp,
  insert,
})
export function createApp(...args: any[]) {
  // @ts-ignore
  return render.createApp(...args)
}
// 因为runtime-core是更底层的实现，所以应该在runtime-dom里面导出，之后index.ts里面导出runtime-dom
export * from '../runtime-core'
