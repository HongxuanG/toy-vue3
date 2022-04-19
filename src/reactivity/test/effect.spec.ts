import { effect } from '../index'
import { reactive } from '../index'
describe('effect test', () => {
  it('effect', () => {
    let count = reactive({ num: 11 })
    let result = 0
    effect(() => {
      result = count.num + 1
    })
    expect(result).toBe(12)
    count.num++
    expect(result).toBe(12)
  })
})
