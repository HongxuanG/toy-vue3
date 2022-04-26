import { createReactiveObject, mutableHandlers, readonlyHandlers } from './baseHandlers'

export function reactive<T extends object>(target: T) {
  return createReactiveObject<T>(target, mutableHandlers)
}
// 其实就是一个没有set操作的reactive
export function readonly<T extends object>(target: T){
  return createReactiveObject<T>(target, readonlyHandlers)
}
