import { reactive, isReactive } from '../reactive'

describe('reactive', () => {
  it('reactive test', () => {
    let original = { num: 1 }
    let count = reactive(original)
    expect(original).not.toBe(count)
    expect(count.num).toEqual(1)
    expect(isReactive(original)).toBe(false)
    expect(isReactive(count)).toBe(true)
  })
  it('nested reactive', () => {
    let original = {
      foo: {
        name: 'ghx'
      },
      arr: [{ age: 23 }]
    }
    const nested = reactive(original)
    expect(isReactive(nested.foo)).toBe(true)
    expect(isReactive(nested.arr)).toBe(true)
    expect(isReactive(nested.arr[0])).toBe(true)
    expect(isReactive(nested.foo)).toBe(true)
    // expect(isReactive(nested.foo.name)).toBe(true) // 涉及到往后的知识点 isRef

  })
})
