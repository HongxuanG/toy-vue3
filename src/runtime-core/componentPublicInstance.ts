import { hasOwn } from '../shared'

export type PublicPropertiesMap = Record<string, (i: any) => any>
// 实例property
const publicPropertiesMap: PublicPropertiesMap = {
  $el: (i: any) => i.vnode.el,
  $slots: (i: any) => i.slots
}
// render函数的this指向，将会指向setup的返回值
export const publicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }, key: string) {
    const { setupState, props } = instance
    // 在setup的return中寻找key
    if (hasOwn(setupState, key)) {
      return setupState[key]
      // 在setup的参数props中寻找key
    } else if (hasOwn(props, key)) {
      return props[key]
    }
    // 在publicPropertiesMap中寻找key，并调用，返回结果
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
}
