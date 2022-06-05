import { isFunction } from '../shared'
import { getCurrentInstance } from './component'
// 跨组件数据共享
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
export function inject<T>(key: string, defaultValue?: T){
  // 接收者
  // 在哪里拿value呢？在instance的parent上面获取到父组件的instance然后点出provide
  const currentInstance: any = getCurrentInstance()
  if(currentInstance){
    const parentProvides = currentInstance.parent.provides

    if (key in parentProvides){
      return parentProvides[key]
    }else{  // 找不到注入的
      // 如果默认值是函数，执行函数
      if (isFunction(defaultValue)) {
        return defaultValue()
      }
      return defaultValue
    }
  }
}
