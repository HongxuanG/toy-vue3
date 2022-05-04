import {computed} from '../computed'
import { reactive } from '../reactive'

describe('reactivity/computed', () => {
  it('should return updated value', () => {
    const value = reactive({ foo: 1 })
    const cValue = computed(() => value.foo)
    expect(cValue.value).toBe(1)
  })

  it('should compute lazily', () => {
    const value = reactive({ foo: 1 })
    const getter = jest.fn(() => value.foo)
    const cValue = computed(getter)

    // lazy功能
    expect(getter).not.toHaveBeenCalled()

    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)
    // 缓存功能
    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute until needed
    value.foo = 2
    expect(getter).toHaveBeenCalledTimes(1)

    // now it should compute
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)
    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })
})
