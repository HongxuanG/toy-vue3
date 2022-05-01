import { shallowReactive, isReactive, isShallow, shallowReadonly }from '../reactive'
describe('shallowReactive test', ()=>{
  it('should not make non-reactive properties reactive', ()=>{
    const original = {
      foo: {
        name: 'ghx'
      }
    }
    const props = shallowReactive(original)
    expect(isReactive(props)).toBe(true)
    expect(isReactive(props.foo)).toBe(false)
    expect(isShallow(props)).toBe(true)
    expect(isShallow(props.foo)).toBe(false)
  })
  it('isShallow',()=>{
    expect(isShallow(shallowReactive({}))).toBe(true)
    expect(isShallow(shallowReadonly({}))).toBe(true)
  })
})
