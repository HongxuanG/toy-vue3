export * from './shapeFlags'
export const extend = Object.assign
// 判断value是否object或者array
export const isObject = (value: unknown) => {
  return value !== null && typeof value === 'object'
}
export const isString = (value: unknown) => {
  return typeof value === 'string'
}
// 类型保护
export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function'
}
export const isArray = Array.isArray
export const hasChanged = (newValue: any, value: any) => {
  return !Object.is(newValue, value)
}
export const isOn = (key: string) => /^on[A-Z]/.test(key)
export const hasOwn = (target: Record<string, any>, key: any) => Object.prototype.hasOwnProperty.call(target, key)

// 把kabobCase => camelCase
export const camelCase = (str: string) => {
  return str.replace(/-(\w)/g, (_, $1: string) => {
    return $1.toUpperCase()
  })
}
// 首字母大写
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
// 事件前缀追加'on'
export const toHandlerKey = (eventName: string) => {
  return eventName ? 'on' + capitalize(eventName) : ''
}
