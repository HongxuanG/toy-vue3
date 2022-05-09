'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// 判断value是否object或者array
const isObject = (value) => {
    return value !== null && typeof value === 'object';
};
// 类型保护
const isFunction = (value) => {
    return typeof value === 'function';
};

function createComponentInstance(vnode) {
    console.log(vnode);
    const type = vnode.type;
    const instance = {
        vnode,
        type
    };
    return instance;
}
// 
function setupComponent(instance) {
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
// 初始化组件的状态
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    // 有时候用户并没有使用setup()
    if (setup) {
        // 处理setup的返回值，如果返回的是对象，那么把对象里面的值注入到template上下文中
        // 如果是一个函数h()，那么直接render
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
    finishComponentSetup(instance);
}
// 处理组件的setup的返回值
function handleSetupResult(instance, setupResult) {
    // TODO handle function
    if (isFunction(setupResult)) ;
    else if (isObject(setupResult)) {
        // 把setup返回的对象挂载到setupState上
        instance.setupState = setupResult;
    }
}
// 结束组件的安装
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (instance) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    // 做patch算法
    patch(vnode);
}
// 例如：
/**
 * template被编译成  {...., setup(){}, render(){}, ....}  这样一个特殊对象
 * 或者{..., data, methods, render(){}, ...}
 *
 * 之后 这个特殊对象作为参数会传入 createVNode()  创建虚拟dom
 *
 *
 */
// 传入vnode，递归对一个组件或者普通元素进行拆箱，在内部对vnode的type判断执行不同的处理函数
function patch(vnode, container) {
    // 检查是什么类型的vnode
    // 是一个普通元素？
    // processElement()
    // 是一个组件？
    // 目前只有一个component所以这里不做区分直接processComponent
    processComponent(vnode);
}
function processComponent(vnode, container) {
    mountComponent(vnode);
}
// 最后，它把setup()的返回值挂载在组件的instance的setupState上
// instance的type的render()函数挂载在组件的instance的render上
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    // 安装组件
    setupComponent(instance);
    //
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    // 这个render()已经在finishComponentSetup处理过了，就是 instance.type.render() 特殊对象的render()
    const subTree = instance.render();
    // 对子树进行拆箱操作
    patch(subTree);
}

// type是 <template></template>经过编译之后具有render()函数的对象，此外还有__file和__hmrId这些无关的属性
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createApp(rootComponent) {
    const mount = (rootContainer) => {
        const vnode = createVNode(rootComponent);
        render(vnode);
    };
    return {
        mount
    };
}

function h(type, props, children) {
}

exports.createApp = createApp;
exports.h = h;
