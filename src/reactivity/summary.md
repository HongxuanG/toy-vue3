# 🚀 reactive & watchEffect 且利用Jest测试实现数据响应式

## 实现思路：
vue3 的数据响应式实现我们想理清楚它的特征，才好往下写。

* 依赖收集
* 触发依赖
  
下面讲一下大体思路：

1. `reactive`为源数据创建`proxy`对象，其中`proxy`的`getter`、`setter`分别用于数据的依赖收集，数据的依赖触发
2. `watchEffect`立即执行一次回调函数，当回调函数内的依赖数据发生变化的时候会再次出发该回调函数
3. 收集依赖我们可以定义一个`track`函数，当reactive的数据发生get操作时，`track`用一个`唯一标识`（下面会将这个`唯一标识`是什么）记录依赖到一个`容器`里面
4. 触发依赖我们可以定义一个`trigger`函数，当reactive的数据发生set操作时，`trigger`将关于这个数据的所有依赖从`容器`里面拿出来逐个执行一遍

## 简单实现：
> 1. `reactive`

给源数据创建一个`proxy`对象，就好像给源数据套上了一层盔甲，这样就可以保证源数据不会被改变，而`proxy`对象可以被改变，这样就可以实现数据响应式

其中`Reflect.get(target, key)`返回target的key对应的属性值res
`Reflect.set(target, key, value)`设置target的key对应的属性值为value
  

```TypeScript
export function reactive(target: Record<string, any>) {
  return new Proxy(target, {
    get(target, key) {
      let res = Reflect.get(target, key)
      return res
    },
    set(target, key, value) {
      let success: boolean
      success = Reflect.set(target, key, value)
      return success
    }
  })
}
```
这时候我们可以编写一个🛠测试用例，跑一跑测试有没有问题
```Typescript
describe('reactive', () => {
  it.skip('reactive test', () => {
    let original = { num: 1 } 
    let count = reactive(original)
    expect(original).not.toBe(count)   ✔
    expect(count.num).toEqual(1)       ✔
  })
})

```

🤮什么？你不是说getter和setter要分别做两件事情吗？😒
* getter进行依赖收集 👀
* setter进行触发依赖 🔌

别急！还不是时候！

> 2. `watchEffect`

 根据官方给出的介绍：`watchEffect`会立即触发回调函数，同时响应式追踪其依赖

watchEffect的基本用法：
 ```typeScript
let result = 0
// 假设count.num == 1
watchEffect(() => {
  result = count.num + 1
})
// 那么输出的result就是2
console.log(result) // output: 2
 ```
其中`count`是已经通过了`reactive`处理的proxy实例对象

根据上述的用法我们可以简单的写出一个`watchEffect`函数

```typescript
class ReactiveEffect {
  private _fn: Function
  constructor(fn: Function) {
    this._fn = fn
  }
  run() {
    this._fn()
  }
}
export function effect(fn: Function) {
  let _reactiveFunc = new ReactiveEffect(fn)
  _reactiveFunc.run()
}

```
再写一个测试用例验证一下
```Typescript
describe('watchEffect test', () => {
  it('watchEffect', () => {
    // 创建proxy代理
    let count = reactive({ num: 11 })
    let result = 0
    // 立即执行effect并跟踪依赖
    watchEffect(() => {
      result = count.num + 1
    })
    expect(result).toBe(12)   ✔

    count.num++
    expect(result).toBe(13)   ✖️
  })
})

```
欸！我们发现了测试最后一项没有通过，哦原来我们还没实现依赖收集和触发依赖啊。。。


> 3. `track`做依赖收集

我想想，我们应该怎么进行依赖收集？对，上面我们提到过有一个`唯一标识`和一个`容器`。我该去哪找这个去拿找这个依赖啊？欸是`容器`，那些依赖是我们需要被触发的呢？欸看`唯一标识`


> 4. `trigger`做触发依赖

这个trigger的实现逻辑很简单：找出target的key对应的所有依赖，并依次执行

1. 用target作为键名拿到在targetMap里面键值depsMap
2. 用key作为键名拿到depsMap的键值deps
3. `然后遍历deps这个Set实例对象，deps里面存的都是`ReactiveEffect`实例对象dep，我们依次执行dep.run()就相当于执行了watchEffect的回调函数了。
   
```typescript
export function trigger(target: Record<EffectKey, any>, key: EffectKey) {
  const depsMap = targetMap.get(target)
  const deps = depsMap?.get(key)
  // 注意deps可能为undefined的情况
  if (deps) {
    for (let dep of deps) {
      dep.run()
    }
  }
}
```

## Jest测试：

```Typescript
describe('watchEffect test', () => {
  it('watchEffect', () => {
    // 创建proxy代理
    let count = reactive({ num: 11 })
    let result = 0
    // 立即执行effect并跟踪依赖
    watchEffect(() => {
      // count.num触发get 存储依赖
      result = count.num + 1
    })
    expect(result).toBe(12)   ✔
    // 这里会先触发proxy的get操作再触发proxy的set操作，触发依赖trigger 更新result
    count.num++
    expect(result).toBe(13)   ✔
  })
})
```
## 总结

[详细代码请看这里](https://github.com/HongxuanG/toy-vue3/tree/main/src/reactivity)
