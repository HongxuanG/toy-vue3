
// 为什么要有ref呢，reactive不行吗？
// 因为reactive用的是proxy，而proxy只能针对对象去监听数据变化，基本数据类型并不能用proxy
// 所以我们想到了class里面的取值函数getter和存值函数getter，他们都能在数据变化的时候对数据加以操作。
import { hasChanged, isObject } from '../shared'
import {Dep} from './effect'
import { triggerEffect, trackEffect, isTracking } from './effect'
import { reactive } from './reactive'
// 定义一个RefImpl类
class RefImpl<T> {
  private _value: T
  public dep?: Dep = undefined
  private rawValue: T
  constructor(value: any) {
    this._value = convert(value)
    this.rawValue = value
    this.dep = new Set()
  }
  get value() {
    trackRefValue(this)
    return this._value
  }
  set value(newValue: any) {
    // 触发依赖

    // 对比旧的值和新的值，如果相等就没必要触发依赖和赋值了，这也是性能优化的点
    if (hasChanged(newValue, this.rawValue)) {
      // 注意这里先赋值再触发依赖
      this._value = convert(newValue)
      this.rawValue = newValue
      triggerEffect(this.dep as Dep)
    }

  }
}
function trackRefValue(ref: RefImpl<any>){
  // 有时候根本就没有调用effect()，也就是说activeEffect是undefined的情况
  if (isTracking()) {
    // 依赖收集
    trackEffect(ref.dep as Dep)
  }
}
// 判断value是否是对象，是：reactive ，否：基本数据类型，直接返回
function convert(value: any){
  return isObject(value) ? reactive(value) : value
}
export function ref<T>(value: T) {
  return new RefImpl(value)
}
