import { proxyRefs } from '../reactivity'
import { shallowReadonly } from '../reactivity/reactive'
import { isFunction, isObject } from '../shared'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { publicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'

export type Data = Record<string, unknown>

export function createComponentInstance(vnode: any, parentComponent: any) {
  console.log('createComponentInstance', parentComponent)
  const type = vnode.type
  const instance = {
    vnode,
    type,
    render: null,
    setupState: {},
    props: {},
    emit: () => {},
    slots: {},
    isMounted: false,
    provides: parentComponent ? parentComponent.provides : {} as Record<string, any>, // 确保中间层的组件没有提供provide时，子组件拿最近的有provide的组件的数据
    parent: parentComponent, // 父组件的组件实例
  }
  instance.emit = emit.bind(null, instance) as any
  return instance
}
//
export function setupComponent(instance: any) {
  // 初始化组件外部传给组件的props
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}
// 初始化有状态的组件
function setupStatefulComponent(instance: any) {
  const Component = instance.type
  // 解决render返回的h()函数里面this的问题，指向setup函数
  instance.proxy = new Proxy({ _: instance } as Data, publicInstanceProxyHandlers)
  const { setup } = Component
  // 有时候用户并没有使用setup()
  if (setup) {
    // 处理setup的返回值，如果返回的是对象，那么把对象里面的值注入到template上下文中
    // 如果是一个函数h()，那么直接render
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })

    handleSetupResult(instance, setupResult)
    setCurrentInstance(null)
  }
  finishComponentSetup(instance)
}
// 处理组件的setup的返回值
function handleSetupResult(instance: any, setupResult: any) {
  // TODO handle function
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    // 把setup返回的对象挂载到setupState上  proxyRefs对setupResult解包
    instance.setupState = proxyRefs(setupResult)
  }
}
// 结束组件的安装
function finishComponentSetup(instance: any) {
  const Component = instance.type // 遇到h('div',{}, this.name)  这里Component将为'div'

  if (instance) {
    instance.render = Component.render
  }
}
export let currentInstance = null
export function getCurrentInstance(){
  return currentInstance
}
function setCurrentInstance(instance: any){
  currentInstance = instance
}
