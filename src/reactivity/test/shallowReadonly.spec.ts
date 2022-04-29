import {isReadonly, shallowReadonly} from '../reactive'
describe('shallowReadonly test', () => { 
  it('shallowReadonly basic test', () => {
    let original = {
      foo: {
        name: 'ghx'
      }
    }
    let obj = shallowReadonly(original)
    expect(isReadonly(obj)).toBe(true)
    expect(isReadonly(obj.foo)).toBe(false)
  })
})
