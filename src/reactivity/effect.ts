class ReactiveEffect {
  private _fn: Function
  constructor(fn: Function) {
    this._fn = fn
  }
  run() {
    // 为什么要在这里把this赋值给activeEffect呢？因为这里是fn执行之前，就是track依赖收集执行之前，又是effect开始执行之后，
    // this能捕捉到这个依赖，将这个依赖赋值给activeEffect是刚刚好的时机
    activeEffect = this
    this._fn()
  }
}
const targetMap = new Map<Record<EffectKey, any>, Map<EffectKey, Set<IDep>>>()
// 当前正在执行的effect
let activeEffect: ReactiveEffect
type EffectKey = string
type IDep = ReactiveEffect
// 这个track的实现逻辑很简单：添加依赖
export function track(target: Record<EffectKey, any>, key: EffectKey) {
  // 寻找dep依赖的执行顺序
  // target -> key -> dep
  let depsMap = targetMap.get(target)
  /**
   * 这里有个疑问：target为{ num: 11 } 的时候我们能获取到depsMap，之后我们count.num++，为什么target为{ num: 12 } 的时候我们还能获取得到相同的depsMap呢？
   * 这里我的理解是 targetMap的key存的只是target的引用 存的字符串就不一样了
   */
  // 解决初始化没有depsMap的情况
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  // deps是一个Set对象，存放着这个key相对应的所有依赖
  let deps = depsMap.get(key)
  // 如果没有key相对应的Set 初始化Set
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  // 将activeEffect实例对象add给deps
  deps.add(activeEffect)
}
// 这个trigger的实现逻辑很简单：找出target的key对应的所有依赖，并依次执行
export function trigger(target: Record<EffectKey, any>, key: EffectKey) {
  const depsMap = targetMap.get(target)
  const deps = depsMap?.get(key)
  if (deps) {
    for (let dep of deps) {
      dep.run()
    }
  }
}
// 根据官方给出的介绍：effect会立即触发这个函数，同时响应式追踪其依赖
export function effect(fn: Function, option = {}) {
  let _reactiveFunc = new ReactiveEffect(fn)
  _reactiveFunc.run()
}
