export function effect(fn: Function, option = {}) {
  fn()
}
export function reactive(obj: Record<string, any>) {
  return obj
}
