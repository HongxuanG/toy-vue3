export type PublicPropertiesMap = Record<string, (i:any)=>any>
const publicPropertiesMap: PublicPropertiesMap = {
  $el: (i: any) => i.vnode.el,
}
export const publicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }, key: string) {
    if (key in instance.setupState) {
      return instance.setupState[key]
    }
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
}
