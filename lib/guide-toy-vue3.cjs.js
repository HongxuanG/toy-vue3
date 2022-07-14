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
const hasChanged = (newValue, value) => {
    return !Object.is(newValue, value);
};
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
const EMPTY_OBJ = {};

class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true; // 该effect是否存活
    }
    run() {
        // 如果effect已经被杀死了，被删除了（stop()函数相关）
        if (!this.active) {
            return this.fn();
        }
        // 为什么要在这里把this赋值给activeEffect呢？因为这里是fn执行之前，就是track依赖收集执行之前，又是effect开始执行之后，
        // this能捕捉到这个依赖，将这个依赖赋值给activeEffect是刚刚好的时机
        activeEffect = this;
        shouldTrack = true; // 把开关打开让他可以收集依赖
        let returnValue = this.fn(); // 执行fn的时候，fn里面会执行get操作，之后就会执行track收集依赖，因为shouldTrack是true，所以依赖收集完成
        // 之后把shouldTrack关闭，这样就没办法在track函数里面收集依赖了
        shouldTrack = false;
        return returnValue;
    }
    stop() {
        var _a;
        // 追加active 标识是为了性能优化，避免每次循环重复调用stop同一个依赖的时候
        if (this.active) {
            cleanupEffect(this);
            (_a = this.onStop) === null || _a === void 0 ? void 0 : _a.call(this);
            this.active = false;
        }
    }
}
// 清除指定依赖
function cleanupEffect(effect) {
    // 对effect解构，解出deps，减少对象在词法环境寻找属性的次数
    const { deps } = effect;
    if (deps.length !== 0) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}
const targetMap = new Map();
// 当前正在执行的effect
let activeEffect;
let shouldTrack = false;
// 这个track的实现逻辑很简单：添加依赖
function track(target, key) {
    // 这里为什么要多一层非空判断呢？
    // 我们查看reactive.spec.ts里面的测试用例
    // 测试用例里根本就没有调用effect()，所以没有执行ReactiveEffect的run()自然activeEffect也就是undefined了
    // if (!activeEffect) return
    // 应不应该收集依赖，从而避免删了依赖又重新添加新的依赖
    // if (!shouldTrack) return
    if (!isTracking())
        return;
    // 寻找dep依赖的执行顺序
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    /**
     * 这里有个疑问：target为{ num: 11 } 的时候我们能获取到depsMap，之后我们count.num++，为什么target为{ num: 12 } 的时候我们还能获取得到相同的depsMap呢？
     * 这里我的理解是 targetMap的key存的只是target的引用 存的字符串就不一样了
     */
    // 解决初始化没有depsMap的情况
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    // dep是一个Set对象，存放着这个key相对应的所有依赖
    let dep = depsMap.get(key);
    // 如果没有key相对应的Set 初始化Set
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
}
// 依赖收集
function trackEffect(dep) {
    // 避免不必要的add操作
    if (dep.has(activeEffect))
        return;
    // 将activeEffect实例对象add给deps
    dep.add(activeEffect);
    // activeEffect的deps 接收 Set<ReactiveEffect>类型的deps
    // 供删除依赖的时候使用(停止监听依赖)
    activeEffect.deps.push(dep);
}
function isTracking() {
    return activeEffect !== undefined && shouldTrack;
}
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
// 根据官方给出的介绍：effect会立即触发这个函数，同时响应式追踪其依赖
function effect(fn, option) {
    let _effect = new ReactiveEffect(fn);
    if (option) {
        extend(_effect, option);
    }
    _effect.run();
    // 注意这里的this指向，return 出去的run方法，方法体里需要用到this，且this必须指向ReactiveEffect的实例对象
    // 不用bind重新绑定this，this会指向undefined
    let runner = _effect.run.bind(_effect);
    // 这里的effect挂载在了函数runner上，作为属性，这是利用了js中函数可以挂在属性的特性
    // 之后呢，实现stop的时候runner就能拿到ReactiveEffect实例对象了
    runner.effect = _effect;
    return runner;
}
// 删除依赖
function stop(runner) {
    runner.effect.stop();
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
        if (key === exports.ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === exports.ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        else if (key === exports.ReactiveFlags.IS_SHALLOW) {
            return isShallow;
        }
        else if (key === exports.ReactiveFlags.RAW) {
            return target;
        }
        let res = Reflect.get(target, key);
        if (!isReadonly) {
            // 判断是否readonly
            // 依赖收集
            track(target, key);
        }
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
const shallowReactiveHandlers = extend({}, mutableHandlers, {
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

exports.ReactiveFlags = void 0;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["IS_SHALLOW"] = "__v_isShallow";
    ReactiveFlags["RAW"] = "__v_raw";
})(exports.ReactiveFlags || (exports.ReactiveFlags = {}));
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
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers);
}
function isReactive(value) {
    // target没有__v_isReactive这个属性，为什么还要写target['__v_isReactive']呢？因为这样就会触发proxy的get操作，
    // 通过判断createGetter传入的参数isReadonly是否为true，否则isReactive为true
    // 优化点：用enum管理状态，增强代码可读性
    return !!value[exports.ReactiveFlags.IS_REACTIVE];
}
function isReadonly(value) {
    // 同上
    return !!value[exports.ReactiveFlags.IS_READONLY];
}
// 检查对象是否是由 reactive 或 readonly 创建的 proxy。
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
// 检查对象是否 开启 shallow mode
function isShallow(value) {
    return !!value[exports.ReactiveFlags.IS_SHALLOW];
}
// 返回 reactive 或 readonly 代理的原始对象
function toRaw(observed) {
    // observed存在，触发get操作，在createGetter直接return target
    const raw = observed && observed[exports.ReactiveFlags.RAW];
    return raw ? toRaw(raw) : observed;
}

// 为什么要有ref呢，reactive不行吗？
// 定义一个RefImpl类
class RefImpl {
    constructor(value) {
        this.dep = undefined;
        this.__v_isRef = true; // 标识是ref对象
        this._value = convert(value);
        this._rawValue = value;
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 触发依赖
        // 对比旧的值和新的值，如果相等就没必要触发依赖和赋值了，这也是性能优化的点
        if (hasChanged(newValue, this._rawValue)) {
            // 注意这里先赋值再触发依赖
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerEffect(this.dep);
        }
    }
}
function trackRefValue(ref) {
    // 有时候根本就没有调用effect()，也就是说activeEffect是undefined的情况
    if (isTracking()) {
        // 依赖收集
        trackEffect(ref.dep);
    }
}
// 判断value是否是对象，是：reactive ，否：基本数据类型，直接返回
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
// 检查值是否为一个 ref 对象。
function isRef(ref) {
    return !!(ref && ref.__v_isRef);
}
// 如果参数是一个 ref，则返回内部值，否则返回参数本身。这是 val = isRef(val) ? val.value : val 的语法糖函数。
function unref(ref) {
    return isRef(ref) ? ref.value : ref;
}
// 通常用在vue3 template里面ref取值，在template里面不需要.value就可以拿到ref的值
function proxyRefs(obj) {
    return isReactive(obj)
        ? obj
        : new Proxy(obj, {
            get(target, key) {
                // unref已经处理了是否ref的情况所以我们不需要自己if处理，如果是，返回.value，如果不是，直接返回值
                return unref(Reflect.get(target, key));
            },
            set(target, key, value) {
                // 因为value为普通值类型的情况特殊，要把value赋值给ref的.value
                if (isRef(target[key]) && !isRef(value)) {
                    target[key].value = value;
                    return true;
                }
                else {
                    return Reflect.set(target, key, value);
                }
            },
        });
}

class ComputedRefImpl {
    constructor(getter, setter) {
        this.setter = setter;
        this._dirty = true; // 避免已经不是第一次执行get操作的时候再次调用compute
        this._effect = new ReactiveEffect(getter, () => {
            // 把dirty重新赋值为true
            if (!this._dirty) {
                this._dirty = true;
            }
        });
    }
    get value() {
        // 如何给dirty重新赋值为true, 触发依赖,调用effect的scheduler()
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
    set value(newValue) {
        this.setter(newValue);
    }
}
// 实现签名
function computed(getterOrOption) {
    let getter;
    let setter;
    // 区分入参是getter还是option
    if (isFunction(getterOrOption)) {
        getter = getterOrOption;
        setter = () => console.error('错误, 因为是getter只读, 不能赋值');
    }
    else {
        getter = getterOrOption.get;
        setter = getterOrOption.set;
    }
    return new ComputedRefImpl(getter, setter);
}

// fragment用来创建一个碎片组件，这个碎片组件并不会真正的渲染出一个<Fragment></Fragment>
// 他的作用就是渲染slots的时候摆脱div的包裹，让slots直接渲染在父组件上。
const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
// type是 <template></template>经过编译之后具有render()函数的对象，此外还有__file和__hmrId这些无关的属性
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
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
// 创建文本虚拟节点 为什么需要创建文本虚拟节点？直接填上文本不行吗？h('div',{},[Foo, '我是文本'])
// 挂载html的时候因为children是数组，必然经过mountChildren的循环，然后patch，单纯填上文本是没办法渲染出来的
// 因为patch并没有针对纯文本做处理，你只能通过div（或者其他html元素）包裹起来生成一个vnode才行，像这样：h('div',{},[Foo, h('div',{}, '我是文本')])
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        const mount = (rootContainer) => {
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        };
        return {
            mount,
        };
    };
}

// 触发父组件自定义事件就好像vue2的$emit
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
    $slots: (i) => i.slots,
    $props: (i) => i.props
};
// render函数的this指向，将会指向setup的返回值
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        // 在 setup 的 return 中寻找key setupState 是 setup 返回的对象
        if (hasOwn(setupState, key)) {
            return setupState[key];
            // 在setup的参数props中寻找key
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // 在publicPropertiesMap中寻找key，并调用，返回结果  解决 this.$props.anything 引用
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
// 具名name作为instance.slots的属性名，属性值是vnode
function normalizeObjectSlots(slots, children) {
    console.log('slots children===>', children);
    // 遍历对象
    for (let key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
        // slots[key] = normalizeSlotValue(value)
    }
    // slots = normalizeSlotValue(slots)
}
// 转成数组
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parentComponent) {
    console.log('createComponentInstance', parentComponent);
    const type = vnode.type;
    const instance = {
        vnode,
        type,
        render: null,
        next: null,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        isMounted: false,
        subTree: {},
        update: null,
        provides: parentComponent ? parentComponent.provides : {},
        parent: parentComponent, // 父组件的组件实例
    };
    instance.emit = emit.bind(null, instance);
    return instance;
}
//
function setupComponent(instance) {
    // 初始化组件外部传给组件的props
    initProps(instance, instance.vnode.props);
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
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        handleSetupResult(instance, setupResult);
        setCurrentInstance(null);
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
        // 把setup返回的对象挂载到setupState上  proxyRefs对setupResult解包（在template上不必书写.value来获取ref值）
        instance.setupState = proxyRefs(setupResult);
    }
}
// 结束组件的安装
function finishComponentSetup(instance) {
    const Component = instance.type; // 遇到h('div',{}, this.name)  这里Component将为'div'
    if (instance) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function shouldUpdateComponent(oldVNode, newVNode) {
    const { props: oldProps } = oldVNode;
    const { props: newProps } = newVNode;
    for (let key in newProps) {
        if (newProps[key] !== oldProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
let isFlushPending = false;
const resolvePromise = Promise.resolve();
const queueJobs = (job) => {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
};
const queueFlush = (queue) => {
    // isFlushPending 是为了不让创建那么多个 promise
    if (isFlushPending)
        return;
    isFlushPending = true;
    // 把 instance.update放到微任务里面执行
    nextTick(flushJobs);
};
const flushJobs = () => {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
};
const nextTick = (callback) => {
    return callback ? resolvePromise.then(callback) : resolvePromise;
};

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // 做patch算法
        patch(null, vnode, container, null, null);
    }
    // 例如：
    /**
     * template被编译成  {...., setup(){}, render(){}, ....}  这样一个特殊对象
     * 或者{..., data, methods, render(){}, ...}
     *
     * 之后 这个特殊对象作为参数会传入 createVNode()  创建虚拟dom
     */
    // 传入vnode，递归对一个组件或者普通元素进行拆箱，在内部对vnode的type判断执行不同的处理函数
    // n1是老的vnode，n2是新的vnode
    function patch(n1, n2, container, parentComponent, anchor) {
        // 检查是什么类型的vnode
        const { type } = n2;
        switch (type) {
            // 这里有个面试题就是：为什么vue2书写template的时候要一个根元素，而vue3不用根元素？
            // 那是因为有fragment的原因：不再重新生成一个div去包裹template里的元素，而是直接patch children
            case Fragment:
                processFragment(n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n2, container);
                break;
            default: {
                // & 左右两边同时为1 则为1   可以应用在 0001 & 0010 判断指定的位置是否为1  这个案例会输出0000  所以为false 指定的位置并没有相同
                if (n2.shapeFlag & 1 /* ELEMENT */) {
                    // 是一个普通元素？处理vnode是普通标签的情况
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (n2.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 是一个组件？处理vnode是组件的情况
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
            }
        }
    }
    function processText(n2, container) {
        mountText(n2, container);
    }
    function processFragment(n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    // 处理组件的情况
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2, container, parentComponent, anchor) {
        // n1 和 n2 都是组件类型的vnode节点
        // n1.component 在mountComponent的时候已经被赋值了。
        const instance = (n2.component = n1.component);
        console.log('旧节点', n1);
        console.log('新节点', n2);
        // 优化：判断新节点和旧节点是否在props上有更改，如果有就执行update，否则跳过
        if (shouldUpdateComponent(n1, n2)) {
            console.log('执行update');
            instance.next = n2;
            // 手动触发 effect
            instance.update();
        }
        else {
            console.log('跳过不执行update');
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    // 处理元素的情况
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    // 最后，它把setup()的返回值挂载在组件的instance的setupState上
    // instance.type的render()函数挂载在组件的instance的render上
    function mountComponent(vnode, container, parentComponent, anchor) {
        // 创建组件实例的时候 也给 vnode的component 赋值 在updateComponent的时候需要拿到组件实例
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
        // 安装组件
        setupComponent(instance);
        // 对render函数进行依赖收集
        setupRenderEffect(instance, vnode, container, anchor);
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // 注意：这个vnode并非是组件的vnode，而是HTML元素的vnode
        const el = (vnode.el = hostCreateElement(vnode.type));
        let { children, props } = vnode;
        // 子节点是文本节点
        if (vnode.shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
            // 子节点是数组
        }
        else if (vnode.shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        let val;
        // 对vnode的props进行处理，把虚拟属性添加到el
        for (let key of Object.getOwnPropertyNames(props).values()) {
            val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // insert操作
        hostInsert(el, container, anchor);
    }
    // 对比element
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement');
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 为什么这里n1的el对象要赋值给n2的el？
        // 因为第一次挂载的时候调用patch，走的mountElement，内部给vnode的el赋值了
        // 而往后的patch都不会走mountElement，而是走patchElement，内部并没有给新的vnode的el赋值，所以这里是属于补救的措施。
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const newShapeFlag = n2.shapeFlag;
        const c1 = n1.children;
        const c2 = n2.children;
        if (newShapeFlag & 4 /* TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                unmountChildren(container);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // text to array
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // 处理子节点和子节点之间，这里面就是diff算法了
                console.log('array to array');
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    // c1是旧节点的子节点数组
    // c2是新节点的子节点数组
    function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
        let i = 0;
        let l2 = c2.length;
        // 指针1
        let e1 = c1.length - 1;
        // 指针2
        let e2 = l2 - 1;
        // 判断是否相同vnode节点
        function isSameVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左端对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break;
            }
            i++;
        }
        console.log(i);
        // 右端对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        console.log('e1', e1);
        console.log('e2', e2);
        // 旧的节点数组没有，新的节点数组有（新增）
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    // 新增
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 处理中间部分
            // a b (c d) e f
            // a b (e c) e f
            let s1 = i;
            let s2 = i;
            let toBePatched = e2 - s2 + 1;
            let patched = 0;
            // 为了能使用映射查找方式需要的map容器，提高patch的效率
            const keyToNewIndexMap = new Map();
            // 定义数组映射，用于查找出需要移动的元素以及移动的位置在哪（这极大的减少了使用insert api的次数）
            const newIndexToOldIndexMap = new Array(toBePatched); // 定长的数组比不定长的数组性能更好
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            // 遍历c2中间部分
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 遍历c1中间部分，找出c1在c2对应的元素，如果找不到，就删除，找到了就更新走patch
            // 遍历旧节点
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                let newIndex;
                // 这里是针对删除做优化，c2的中间部分都已经被遍历过了，c1剩下的部分就没必要处理了，直接删除就好。
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                // 优先使用keyToNewIndexMap查找映射值，优化性能
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 改为使用双重循环查找映射值
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 找不到映射关系，删除该节点
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 能确认新的节点是存在的
                    newIndexToOldIndexMap[newIndex - s2] = i + 1; // 这里为什么要+1，因为为0另外代表着该元素在c1上没有，需要新增
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 根据映射表生成最长递增子序列
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // let j = 0  // 指针
            // for (let i = 0; i < toBePatched; i++) {
            //   if (i !== increasingNewIndexSequence[j]) {
            //     console.log('需要移动');
            //   }else{
            //     // 不需要移动 指针j++，判断递增子序列的下一个索引是否与 i 相等
            //     j++
            //   }
            // }
            // 为什么需要倒序遍历呢？因为需要一个固定的节点作为锚点，正序遍历只能确定一个不稳定的锚点
            // looping backwards so that we can use last patched node as anchor
            //
            let j = increasingNewIndexSequence.length - 1; // 指针
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null; // 防止nextIndex + 1超出l2范围
                // 新增节点
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    // j < 0 也是考虑到性能优化（increasingNewIndexSequence[-1]已经不存在了）
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        console.log('需要移动');
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 不需要移动 指针j++，判断递增子序列的下一个索引是否与 i 相等
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(child) {
        for (let i = 0; i < child.length; i++) {
            hostRemove(child[i]);
        }
    }
    // 对比props
    function patchProps(el, oldProps, newProps) {
        // 相同的props没必要比较
        if (oldProps !== newProps) {
            for (let key in newProps) {
                const newProp = newProps[key];
                const oldProp = oldProps[key];
                if (newProp !== oldProp) {
                    hostPatchProp(el, key, oldProp, newProp);
                }
            }
            // 老props是空对象就没必要循环
            if (oldProps !== EMPTY_OBJ) {
                for (let key in oldProps) {
                    // 新的props没有该属性
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountText(vnode, container) {
        const { children } = vnode;
        const textNode = (vnode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((vnode) => {
            patch(null, vnode, container, parentComponent, anchor);
        });
    }
    function setupRenderEffect(instance, vnode, container, anchor) {
        instance.update = effect(() => {
            // 通过一个变量isMounted区分是初始化还是更新
            if (!instance.isMounted) {
                // 这个render()已经在finishComponentSetup处理过了，就是 instance.type.render() 特殊对象的render()
                // render函数内部的this指向 修改为 setupStatefulComponent中定义的proxy对象
                const subTree = instance.render.call(instance.proxy);
                instance.subTree = subTree;
                // 对子树进行拆箱操作 递归进去
                console.log('subTree===>', subTree);
                patch(null, subTree, container, instance, anchor);
                // 代码到了这里，组件内的所有element已经挂在到document里面了
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('updated');
                // TODO：更新组件el和props
                // 需要获取新的vnode
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(instance.proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                // 得益于 effect 的 scheduler 我们就可以实现异步更新dom了
                queueJobs(instance.update);
            }
        });
    }
    // 用于更新组件
    function updateComponentPreRender(instance, nextVNode) {
        // 替换到老的vnode
        instance.vnode = nextVNode;
        // 新的vnode初始化为null
        instance.next = null;
        // 更新props
        instance.props = nextVNode.props;
    }
    return {
        createApp: createAppAPI(render),
        render,
    };
}
// 最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function h(type, props, children) {
    console.log('type===>', type);
    return createVNode(type, props, children);
}

// slots已经在initSlots中做了处理（把slots挂载到instance.slots上）
function renderSlot(slots, name = 'default', props) {
    const slot = slots[name];
    console.log('slot==>', slots, slot);
    if (slot) {
        if (typeof slot === 'function') {
            // slots有可能是对象，数组
            // 但是这里额外渲染了一层div，怎么去解决呢？定义一个vnode.type叫Fragment，内部只处理children
            // 就好像走了processElement()逻辑一样，不用的是他不会给Fragment生成HTML元素节点
            // return createVNode('div', {}, slot(props))
            // 执行slot(props)会返回一个vnode数组
            return createVNode(Fragment, {}, slot(props));
            // return createVNode(Fragment, {}, slot)
        }
    }
    else {
        return slots;
    }
}

// 跨组件数据共享
function provide(key, value) {
    // 提供者
    // key和value存在哪呢？挂在instance的provides属性上吧！
    var _a;
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = (_a = currentInstance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (provides === parentProvides) {
            // 把provide原型指向父组件的provide
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 接收者
    // 在哪里拿value呢？在instance的parent上面获取到父组件的instance然后点出provide
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else { // 找不到注入的
            // 如果默认值是函数，执行函数
            if (isFunction(defaultValue)) {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

// 创建元素
function createElement(type) {
    return document.createElement(type);
}
// 处理props
function patchProp(el, key, oldValue, newValue) {
    if (Array.isArray(newValue)) {
        el.setAttribute(key, newValue.join(' '));
    }
    else if (isOn(key) && isFunction(newValue)) {
        // 添加事件
        el.addEventListener(key.slice(2).toLowerCase(), newValue);
    }
    else {
        // props属性的属性值是undefined或者null，删除该属性
        if (newValue === null || newValue === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newValue);
        }
    }
}
// 插入元素  anchor锚点 插入哪一个位置之前，如果是null则默认插入到最后
function insert(child, container, anchor = null) {
    container.insertBefore(child, anchor);
    // container.append(el)
}
// 删除元素
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
// 设置元素文本
function setElementText(el, text) {
    el.textContent = text;
}
// 通过对以上函数的抽离，方便实现了自定义渲染器的逻辑
// 以后想自定义渲染器，传入三个函数即可
const render = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    // @ts-ignore
    return render.createApp(...args);
}

exports.computed = computed;
exports.createApp = createApp;
exports.createElement = createElement;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.insert = insert;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.isShallow = isShallow;
exports.nextTick = nextTick;
exports.patchProp = patchProp;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.remove = remove;
exports.renderSlot = renderSlot;
exports.setElementText = setElementText;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.toRaw = toRaw;
exports.track = track;
exports.trackEffect = trackEffect;
exports.trigger = trigger;
exports.triggerEffect = triggerEffect;
exports.unref = unref;
//# sourceMappingURL=guide-toy-vue3.cjs.js.map
