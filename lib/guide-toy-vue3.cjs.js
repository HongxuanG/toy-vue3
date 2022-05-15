'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
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
const isArray = Array.isArray;
const isOn = (key) => /^on[A-Z]/.test(key);
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
// 把kabobCase => camelCase
const camelCase = (str) => {
    return str.replace(/-(\w)/g, (_, $1) => {
        return $1.toUpperCase();
    });
};
// 首字母大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// 事件前缀追加'on'
const toHandlerKey = (eventName) => {
    return eventName ? 'on' + capitalize(eventName) : '';
};

const targetMap = new Map();
// 这个trigger的实现逻辑很简单：找出target的key对应的所有依赖，并依次执行
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap === null || depsMap === void 0 ? void 0 : depsMap.get(key);
    if (dep) {
        triggerEffect(dep);
    }
}
// 触发依赖
function triggerEffect(dep) {
    for (let effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

// 此处调用一次createSetter和getter，为了不在每次使用mutableHandlers的时候重复调用
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// shallowReactive的get操作
const shallowGet = createGetter(false, true);
// shallowReactive的set操作
const shallowSet = createSetter(true);
// 高阶函数
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        // isReactive和isReadonly 都是根据传入的参数 `isReadonly`来决定是否返回true | false的
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        else if (key === ReactiveFlags.IS_SHALLOW) {
            return isShallow;
        }
        else if (key === ReactiveFlags.RAW) {
            return target;
        }
        let res = Reflect.get(target, key);
        if (isShallow) {
            return res;
        }
        // 之前都是只实现表面一层的reactive，我们现在实现嵌套对象的reactive
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
// 这个isShallow涉及到的是shallowReactive
function createSetter(isShallow = false) {
    return function set(target, key, value) {
        let success;
        success = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return success;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`${JSON.stringify(target)} do not set ${String(key)} value ${value}, because it is readonly`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});
extend({}, mutableHandlers, {
    get: shallowGet,
    set: shallowSet,
});
function createReactiveObject(target, handlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} is not a object`);
        return target;
    }
    return new Proxy(target, handlers);
}

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["IS_SHALLOW"] = "__v_isShallow";
    ReactiveFlags["RAW"] = "__v_raw";
})(ReactiveFlags || (ReactiveFlags = {}));
function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
// 其实就是一个没有set操作的reactive（会深层readonly）
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
// 浅浅的readonly一下，创建一个 proxy，使其自身的 property 为只读，但不执行嵌套对象的深度只读转换 (暴露原始值)
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    const eventName = toHandlerKey(camelCase(event));
    console.log(eventName);
    const handler = props[eventName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

// 实例property
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        // 在setup的return中寻找key
        if (hasOwn(setupState, key)) {
            return setupState[key];
            // 在setup的参数props中寻找key
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // 在publicPropertiesMap中寻找key，并调用，返回结果
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

// 如果children里面有slot，那么把slot挂载到instance上
function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOTS_CHILDREN */) {
        normalizeObjectSlots(instance.slots, children);
    }
}
function normalizeObjectSlots(slots, children) {
    for (let key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

function createComponentInstance(vnode) {
    const type = vnode.type;
    const instance = {
        vnode,
        type,
        render: null,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
    };
    instance.emit = emit.bind(null, instance);
    return instance;
}
//
function setupComponent(instance) {
    // 初始化组件外部传给组件的props
    initProps(instance, instance.vnode.props);
    console.log('children===>', instance.vnode.children);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
// 初始化有状态的组件
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 解决render返回的h()函数里面this的问题，指向setup函数
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    // 有时候用户并没有使用setup()
    if (setup) {
        // 处理setup的返回值，如果返回的是对象，那么把对象里面的值注入到template上下文中
        // 如果是一个函数h()，那么直接render
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
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
 */
// 传入vnode，递归对一个组件或者普通元素进行拆箱，在内部对vnode的type判断执行不同的处理函数
function patch(vnode, container) {
    // 检查是什么类型的vnode
    console.log('vnode', vnode.type);
    // & 左右两边同时为1 则为1   可以应用在 0001 & 0010 判断指定的位置是否为1  这个案例会输出0000  所以为false 指定的位置并没有相同
    if (vnode.shapeFlag & 1 /* ELEMENT */) {
        // 是一个普通元素？处理vnode是普通标签的情况
        processElement(vnode, container);
    }
    else if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        // 是一个组件？处理vnode是组件的情况
        processComponent(vnode, container);
    }
}
// 处理组件的情况
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
// 处理元素的情况
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
    // 子节点是文本节点
    if (vnode.shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
        // 子节点是数组
    }
    else if (vnode.shapeFlag & 8 /* ARRAY_CHILDREN */) {
        mountChildren(vnode, el);
    }
    let val;
    // 对vnode的props进行处理，把虚拟属性添加到el
    for (let key of Object.getOwnPropertyNames(props).values()) {
        val = props[key];
        if (Array.isArray(val)) {
            el.setAttribute(key, val.join(' '));
        }
        else if (isOn(key) && isFunction(val)) {
            el.addEventListener(key.slice(2).toLowerCase(), val);
        }
        else {
            el.setAttribute(key, val);
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
    // 对子树进行拆箱操作 递归进去
    patch(subTree, container);
    // 代码到了这里，组件内的所有element已经挂在到document里面了
    vnode.el = subTree.el;
}

// type是 <template></template>经过编译之后具有render()函数的对象，此外还有__file和__hmrId这些无关的属性
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    normalizeChildren(vnode, children);
    return vnode;
}
// 根据vnode.type标志vnode类型
function getShapeFlag(type) {
    return isString(type)
        ? 1 /* ELEMENT */
        : isObject(type)
            ? 2 /* STATEFUL_COMPONENT */
            : 0;
}
// 给vnode.shapeFlag追加标识
function normalizeChildren(vnode, children) {
    // | 左右两边为0 则为0   可以用于给二进制指定的位数修改成1  例如：0100 | 0001 = 0101
    // 在这里相当于给vnode追加额外的标识
    if (isString(children)) {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
        // 子级是数组
    }
    else if (isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    // vnode是组件
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        // 子级是对象
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* SLOTS_CHILDREN */;
        }
    }
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

// slots已经在initSlots中做了处理（把）
function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            // slots有可能是对象，数组
            return createVNode('div', {}, slot(props));
        }
    }
}

exports.createApp = createApp;
exports.h = h;
exports.renderSlots = renderSlots;
//# sourceMappingURL=guide-toy-vue3.cjs.js.map
