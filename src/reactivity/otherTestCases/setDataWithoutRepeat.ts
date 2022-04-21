export function setDataWithoutRepeat(context: any, data: Record<string, any>) {
  let parentNode = context.data
  let changed = false
  // parent 父对象
  function internalSetData(parent: any, data: Record<string, any>) {
    let o = {} as typeof data
    for (let key in data) {
      // 新增的属性
      if (!parent.hasOwnProperty(key)) {
        if (Object.prototype.toString.call(data[key]) === '[object Object]') {
          parent[key] = {}
        } else if (Object.prototype.toString.call(data[key]) === '[object Array]') {
          parent[key] = []
        }
      }
      if (typeof data[key] === 'object') {
        o[key] = internalSetData(parent[key], data[key])
      } else {
        // 核心处理逻辑
        // key == data第一层  如果要做到data第二层呢？所以需要递归
        if (parent[key] != data[key]) {
          console.log('updated！')
          o[key] = data[key]
          changed = true
        }
      }
    }
    return o
  }

  let diff = internalSetData(parentNode, data)
  if (!changed) return null
  return diff
  // context.setData(diff)
}

