import { getCurrentInstance } from './component'

export function provide<T>(key: string | number, value: T){
  // 提供者
  // key和value存在哪呢？挂在instance的provides属性上吧！
  
  const currentInstance: any = getCurrentInstance()
  if(currentInstance){
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent?.provides
    if(provides === parentProvides){
      // 把provide原型指向父组件的provide
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    provides[key] = value
  }
}
export function inject<T>(key: string, defaultValue?: unknown){
  // 接收者
  // 在哪里拿value呢？在instance的parent上面获取到父组件的instance然后点出provide
  const currentInstance: any = getCurrentInstance()
  const parentProvides = currentInstance.parent.provides
  if(currentInstance){
    return parentProvides[key] ? parentProvides[key] : defaultValue ? defaultValue : null
  }
}
