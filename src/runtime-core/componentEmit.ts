import { camelCase, toHandlerKey } from "../shared"

export function emit(instance: any, event: string, ...args: unknown[]){
  const {props} = instance

  
  const eventName = toHandlerKey(camelCase(event))
  console.log(eventName)
  const handler = props[eventName]
  handler && handler(...args)
}
