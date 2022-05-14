import { hasOwn } from '../shared'

export type PublicPropertiesMap = Record<string, (i: any) => any>
const publicPropertiesMap: PublicPropertiesMap = {
  $el: (i: any) => i.vnode.el,
}
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

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
}
