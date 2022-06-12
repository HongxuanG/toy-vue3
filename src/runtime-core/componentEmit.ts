import { camelCase, toHandlerKey } from "../shared"

// 触发父组件自定义事件就好像vue2的$emit
export function emit(instance: any, event: string, ...args: unknown[]){
  const {props} = instance

  
  const eventName = toHandlerKey(camelCase(event))
  console.log(eventName)
  const handler = props[eventName]
  handler && handler(...args)
}
