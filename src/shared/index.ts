export const extend = Object.assign
// 判断value是否object或者array
export const isObject = (value: unknown) => {
  return value !== null && typeof value === 'object'
}
