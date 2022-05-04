import { isFunction } from "../shared"
import { ReactiveEffect } from "./effect"

export class ComputedRefImpl<T> {
  public _value!: T
  private _dirty = true // 避免已经不是第一次执行get操作的时候再次调用compute
  private _effect: ReactiveEffect // 进行依赖收集
  constructor(
    getter: ComputedGetter<T>,
    private setter: ComputedSetter<T>
  ) {
    // 给activeEffect赋值, 一边后续能有依赖可以收集
    this._effect = new ReactiveEffect(getter, ()=>{
      // 把dirty重新赋值为true
      if(!this._dirty){
        this._dirty = true
      }
    })
  }
  get value() {
    // 如何给dirty重新赋值为true, 触发依赖,调用effect的scheduler()
    if(this._dirty){
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
  set value(newValue: T) {
    this.setter(newValue)
  }
}

type ComputedGetter<T> = (...args: any[])=> T
// v 是 赋值 = 右边的值
type ComputedSetter<T> = (v: T) => void
interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}
// 函数重载
export function computed<T>(option: WritableComputedOptions<T>): any
export function computed<T>(getter: ComputedGetter<T>): ComputedRefImpl<T>
// 实现签名
export function computed<T>(getterOrOption: ComputedGetter<T> | WritableComputedOptions<T>) {
  let getter: ComputedGetter<T>
  let setter: ComputedSetter<T>
  // 区分入参是getter还是option
  if(isFunction(getterOrOption)){
    getter = getterOrOption
    setter = () => console.error('错误, 因为是getter只读, 不能赋值')
  }else{
    getter = getterOrOption.get
    setter = getterOrOption.set
  }
  return new ComputedRefImpl(getter, setter)
}
