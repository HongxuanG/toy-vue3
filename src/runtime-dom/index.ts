import { createRenderer } from '../runtime-core/renderer'
import { isFunction, isOn } from '../shared'

export function createElement(type: any) {
  console.log('createElement-----------')
  return document.createElement(type)
}
export function patchProp(el: any, key: string, value: any) {
  console.log('patchProp-----------')
  if (Array.isArray(value)) {
    el.setAttribute(key, value.join(' '))
  } else if (isOn(key) && isFunction(value)) {
    // 添加事件
    el.addEventListener(key.slice(2).toLowerCase(), value)
  } else {
    el.setAttribute(key, value)
  }
}
export function insert(el: any, container: any) {
  console.log('insert-----------')
  container.append(el)
}
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
