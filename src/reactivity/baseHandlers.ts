import { track, trigger } from './effect'
import { reactive, ReactiveFlags, readonly } from './reactive'
import { isObject } from '../shared'
// 此处调用一次createSetter和getter，为了不在每次使用mutableHandlers的时候重复调用
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

// 高阶函数，
export function createGetter<T extends object>(isReadonly = false) {
  return function get(target: T, key: string | symbol) {
    // isReactive和isReadonly 都是根据传入的参数 `isReadonly`来决定是否返回true | false的
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    let res = Reflect.get(target, key)
    // 之前都是只实现表面一层的reactive，我们现在实现嵌套对象的reactive
    if(isObject(res)){
      return isReadonly ? readonly(res) : reactive(res)
    }
    if (!isReadonly) {
      // 判断是否readonly
      // 依赖收集
      track(target, key as string)
    }
    return res
  }
}
export function createSetter<T extends object>() {
  return function set(target: T, key: string | symbol, value: any) {
    let success: boolean
    success = Reflect.set(target, key, value)
    // 触发依赖
    trigger(target, key as string)
    return success
  }
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
}
export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`${target} do not set ${String(key)} value ${value}, because it is readonly`)
    return true
  },
}
export function createReactiveObject<T extends object>(target: T, handlers: ProxyHandler<T>) {
  return new Proxy(target, handlers)
}
