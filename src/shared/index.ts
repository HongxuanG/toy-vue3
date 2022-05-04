export const extend = Object.assign
// 判断value是否object或者array
export const isObject = (value: unknown) => {
  return value !== null && typeof value === 'object'
}
// 类型保护
export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function'
}
export const hasChanged = (newValue: any, value: any) => {
  return !Object.is(newValue, value)
}
