import { shallowReactive, isReactive, isShallow, shallowReadonly, reactive } from '../reactive'
describe('shallowReactive test', () => {
  it('should not make non-reactive properties reactive', () => {
    const original = {
      foo: {
        name: 'ghx',
      },
    }
    const props = shallowReactive(original)
    expect(isReactive(props)).toBe(true)
    expect(isReactive(props.foo)).toBe(false)
    expect(isShallow(props)).toBe(true)
    expect(isShallow(props.foo)).toBe(false)
  })
  it('isShallow', () => {
    expect(isShallow(shallowReactive({}))).toBe(true)
    expect(isShallow(shallowReadonly({}))).toBe(true)
  })
  test('should keep reactive properties reactive', () => {
    const props: any = shallowReactive({ n: reactive({ foo: 1 }) })
    props.n = reactive({ foo: 2 })
    expect(isReactive(props.n)).toBe(true)
  })
  // shadowReactive只是监听了第一层的属性变化，第一层属性变化，视图会更新；其他层属性变化，视图不会更新
  // 虽然proxy里面的深层属性已经改变了，但是并没有在视图上体现出来，视图上的值仍然是旧值。
  it('should be non-reactive in nested object', () => {
    const raw = {
      foo: 1,
      nested: {
        bar: 2,
      },
    }
    const state = shallowReactive(raw)

    // 改变 state 本身的性质是响应式的
    state.foo++
    expect(raw.foo).toBe(2)
    expect(state.foo).toBe(2)
    // ...但是不转换嵌套对象
    expect(isReactive(state.nested)).toBe(false) // false
    state.nested.bar++ // 非响应式
    expect(raw.nested.bar).toBe(3)
    // 视图上的值仍然是2。
    expect(state.nested.bar).toBe(3)
  })
})
