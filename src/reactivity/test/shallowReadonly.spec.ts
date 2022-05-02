import {isReactive, isReadonly, shallowReadonly} from '../reactive'
describe('shallowReadonly test', () => { 
  it('shallowReadonly basic test', () => {
    let original = {
      foo: {
        name: 'ghx'
      }
    }
    let obj = shallowReadonly(original)
    expect(isReadonly(obj)).toBe(true)
    // 因为只做表层的readonly，深层的数据还不是proxy
    expect(isReadonly(obj.foo)).toBe(false)
    expect(isReactive(obj.foo)).toBe(false)
  })
  it('should change value in nested obj', () => {
    const raw = {
      foo: 1,
      nested: {
        bar: 2,
      },
    }
    const state = shallowReadonly(raw)

    // 改变 state 本身的 property 将失败
    state.foo++
    expect(state.foo).toBe(1)
    // ...但适用于嵌套对象
    expect(isReadonly(state.nested)).toBe(false) // false
    state.nested.bar++ // 适用
    expect(state.nested.bar).toBe(3)
    expect(raw.nested.bar).toBe(3)
  })
})
