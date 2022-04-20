import { reactive } from '../reactive'

describe('reactive', () => {
  it.skip('reactive test', () => {
    let original = { num: 1 }
    let count = reactive(original)
    expect(original).not.toBe(count)
    expect(count.num).toEqual(1)
  })
})
