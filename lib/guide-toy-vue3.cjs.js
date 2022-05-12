'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// 判断value是否object或者array
const isObject = (value) => {
    return value !== null && typeof value === 'object';
};
const isString = (value) => {
    return typeof value === 'string';
};
// 类型保护
const isFunction = (value) => {
    return typeof value === 'function';
};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        if (key in instance.setupState) {
            return instance.setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const type = vnode.type;
    const instance = {
        vnode,
        type,
        render: null,
        setupState: {},
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
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
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
    if (isFunction(setupResult)) {
        instance.render = setupResult;
    }
    else if (isObject(setupResult)) {
        // 把setup返回的对象挂载到setupState上
        instance.setupState = setupResult;
    }
}
// 结束组件的安装
function finishComponentSetup(instance) {
    const Component = instance.type; // 遇到h('div',{}, this.name)  这里Component将为'div'
    if (instance) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    // 做patch算法
    patch(vnode, container);
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
    console.log('vnode', vnode.type);
    if (isString(vnode.type)) {
        // 是一个普通元素？处理vnode是普通标签的情况
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 是一个组件？处理vnode是组件的情况
        // 目前只有一个component所以这里不做区分直接 processComponent
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
// 最后，它把setup()的返回值挂载在组件的instance的setupState上
// instance.type的render()函数挂载在组件的instance的render上
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    // 安装组件
    setupComponent(instance);
    //
    setupRenderEffect(instance, vnode, container);
}
function mountElement(vnode, container) {
    // 注意：这个vnode并非是组件的vnode，而是HTML元素的vnode
    console.log('mountElement', vnode);
    const el = (vnode.el = document.createElement(vnode.type));
    let { children, props } = vnode;
    if (isString(children)) {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    // 对vnode的props进行处理，把虚拟属性添加到el
    for (let key of Object.getOwnPropertyNames(props).values()) {
        if (Array.isArray(props[key])) {
            el.setAttribute(key, props[key].join(' '));
        }
        else {
            el.setAttribute(key, props[key]);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((vnode) => {
        console.log('mountChildren==>', vnode);
        patch(vnode, container);
    });
}
function setupRenderEffect(instance, vnode, container) {
    console.log(instance);
    // 这个render()已经在finishComponentSetup处理过了，就是 instance.type.render() 特殊对象的render()
    // render函数内部的this指向 修改为 setupStatefulComponent中定义的proxy对象
    const subTree = instance.render.call(instance.proxy);
    // 对子树进行拆箱操作
    patch(subTree, container);
    // 到了这里，组件内的所有element已经挂在到document里面了
    vnode.el = subTree.el;
}

// type是 <template></template>经过编译之后具有render()函数的对象，此外还有__file和__hmrId这些无关的属性
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null
    };
    return vnode;
}

function createApp(rootComponent) {
    const mount = (rootContainer) => {
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
    };
    return {
        mount,
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
