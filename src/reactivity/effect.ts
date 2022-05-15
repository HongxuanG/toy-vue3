import { extend } from '../shared'

export type EffectScheduler = (...args: any[]) => any
export type Dep = Set<ReactiveEffect>
export class ReactiveEffect {
  public deps: Dep[] = []
  public active = true // 该effect是否存活
  public onStop?: () => void
  constructor(public fn: Function, public scheduler?: EffectScheduler) {}
  run() {
    // 如果effect已经被杀死了，被删除了（stop()函数相关）
    if (!this.active) {
      return this.fn()
    }
    // 为什么要在这里把this赋值给activeEffect呢？因为这里是fn执行之前，就是track依赖收集执行之前，又是effect开始执行之后，
    // this能捕捉到这个依赖，将这个依赖赋值给activeEffect是刚刚好的时机
    activeEffect = this
    shouldTrack = true // 把开关打开让他可以收集依赖
    let returnValue = this.fn() // 执行fn的时候，fn里面会执行get操作，之后就会执行track收集依赖，因为shouldTrack是true，所以依赖收集完成
    // 之后把shouldTrack关闭，这样就没办法在track函数里面收集依赖了
    shouldTrack = false

    return returnValue
  }
  stop() {
    // 追加active 标识是为了性能优化，避免每次循环重复调用stop同一个依赖的时候
    if (this.active) {
      cleanupEffect(this)
      this.onStop?.()
      this.active = false
    }
  }
}
// 清除指定依赖
function cleanupEffect(effect: ReactiveEffect) {
  // 对effect解构，解出deps，减少对象在词法环境寻找属性的次数
  const { deps } = effect
  if (deps.length !== 0) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}
const targetMap = new Map<Record<EffectKey, any>, Map<EffectKey, Set<IDep>>>()
// 当前正在执行的effect
let activeEffect: ReactiveEffect
let shouldTrack = false
type EffectKey = string
type IDep = ReactiveEffect
// 这个track的实现逻辑很简单：添加依赖
export function track(target: Record<EffectKey, any>, key: EffectKey) {
  // 这里为什么要多一层非空判断呢？
  // 我们查看reactive.spec.ts里面的测试用例
  // 测试用例里根本就没有调用effect()，所以没有执行ReactiveEffect的run()自然activeEffect也就是undefined了
  // if (!activeEffect) return
  // 应不应该收集依赖，从而避免删了依赖又重新添加新的依赖
  // if (!shouldTrack) return
  if (!isTracking()) return
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
  // dep是一个Set对象，存放着这个key相对应的所有依赖
  let dep = depsMap.get(key)
  // 如果没有key相对应的Set 初始化Set
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  trackEffect(dep)
}
// 依赖收集
export function trackEffect(dep: Dep){
  // 避免不必要的add操作
  if (dep.has(activeEffect)) return
  // 将activeEffect实例对象add给deps
  dep.add(activeEffect)
  // activeEffect的deps 接收 Set<ReactiveEffect>类型的deps
  // 供删除依赖的时候使用(停止监听依赖)
  activeEffect.deps.push(dep)
}
export function isTracking() {
  return activeEffect !== undefined && shouldTrack
}
// 这个trigger的实现逻辑很简单：找出target的key对应的所有依赖，并依次执行
export function trigger(target: Record<EffectKey, any>, key: EffectKey) {
  const depsMap = targetMap.get(target)
  const dep = depsMap?.get(key)
  if (dep) {
    triggerEffect(dep)
  }
}
// 触发依赖
export function triggerEffect(dep: Dep){
  for (let effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}
export interface EffectOption {
  scheduler?: EffectScheduler
  onStop?: () => void
}
// 里面存有一个匿名函数
export interface EffectRunner<T = any> {
  (): T
  effect: ReactiveEffect
}
// 根据官方给出的介绍：effect会立即触发这个函数，同时响应式追踪其依赖
export function effect<T = any>(fn: () => T, option?: EffectOption): EffectRunner {
  let _effect = new ReactiveEffect(fn)
  if (option) {
    extend(_effect, option)
  }
  _effect.run()
  // 注意这里的this指向，return 出去的run方法，方法体里需要用到this，且this必须指向ReactiveEffect的实例对象
  // 不用bind重新绑定this，this会指向undefined
  let runner = _effect.run.bind(_effect) as EffectRunner
  // 这里的effect挂载在了函数runner上，作为属性，这是利用了js中函数可以挂在属性的特性
  // 之后呢，实现stop的时候runner就能拿到ReactiveEffect实例对象了
  runner.effect = _effect
  return runner
}
export function stop(runner: EffectRunner) {
  runner.effect.stop()
}
