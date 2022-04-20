import { effect } from '../index'
import { reactive } from '../index'
describe('effect test', () => {
  it('effect', () => {
    // 创建proxy代理
    let count = reactive({ num: 11 })
    let result = 0
    // 立即执行effect并跟踪依赖
    effect(() => {
      // count.num触发get 存储依赖
      result = count.num + 1
    })
    expect(result).toBe(12)
    // 这里会先触发proxy的get操作再触发proxy的set操作，触发依赖trigger 更新result
    count.num++
    expect(result).toBe(13)
  })
})
