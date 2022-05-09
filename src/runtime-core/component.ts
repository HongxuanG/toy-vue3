import { isFunction, isObject } from "../shared"

export function createComponentInstance(vnode: any) {
  const type = vnode.type
  const instance = {
    vnode,
    type
  }
  return instance
}
// 
export function setupComponent(instance: any){
  // initProps()
  // initSlots()
  setupStatefulComponent(instance)
}
// 初始化组件的状态
function setupStatefulComponent(instance: any){

  const Component = instance.type
  const {setup} = Component
  // 有时候用户并没有使用setup()
  if(setup){
    // 处理setup的返回值，如果返回的是对象，那么把对象里面的值注入到template上下文中
    // 如果是一个函数h()，那么直接render

    const setupResult = setup()

    handleSetupResult(instance, setupResult)
  }
  finishComponentSetup(instance)
}
// 处理组件的setup的返回值
function handleSetupResult(instance: any, setupResult: any) {
  // TODO handle function
  if(isFunction(setupResult)){

  } else if(isObject(setupResult)){
    // 把setup返回的对象挂载到setupState上
    instance.setupState = setupResult
  }
}
// 结束组件的安装
function finishComponentSetup(instance: any) {
  const Component = instance.type
  if(instance){
    instance.render = Component.render
  }
}
