import { track, trigger } from './effect'

export function reactive(target: Record<string, any>) {
  return new Proxy(target, {
    get(target, key) {
      let res = Reflect.get(target, key)
      // 依赖收集
      track(target, key as string)
      return res
    },
    set(target, key, value) {
      let success: boolean
      success = Reflect.set(target, key, value)
      // 触发依赖
      trigger(target, key as string)
      return success
    }
  })
}
