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
function shallowReactive(target) {
    return createReactiveObject(target, shallowReactiveHandlers);
}
function isReactive(value) {
    // target没有__v_isReactive这个属性，为什么还要写target['__v_isReactive']呢？因为这样就会触发proxy的get操作，
    // 通过判断createGetter传入的参数isReadonly是否为true，否则isReactive为true
    // 优化点：用enum管理状态，增强代码可读性
    return !!value[ReactiveFlags.IS_REACTIVE];
}
function isReadonly(value) {
    // 同上
    return !!value[ReactiveFlags.IS_READONLY];
}
// 检查对象是否是由 reactive 或 readonly 创建的 proxy。
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
// 检查对象是否 开启 shallow mode
function isShallow(value) {
    return !!value[ReactiveFlags.IS_SHALLOW];
}
// 返回 reactive 或 readonly 代理的原始对象
function toRaw(observed) {
    // observed存在，触发get操作，在createGetter直接return target
    const raw = observed && observed[ReactiveFlags.RAW];
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
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        isMounted: false,
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
        // 把setup返回的对象挂载到setupState上  proxyRefs对setupResult解包
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

function createRenderer(options) {
    const { createElement, patchProp, insert } = options;
    function render(vnode, container) {
        // 做patch算法
        patch(vnode, container, null);
    }
    // 例如：
    /**
     * template被编译成  {...., setup(){}, render(){}, ....}  这样一个特殊对象
     * 或者{..., data, methods, render(){}, ...}
     *
     * 之后 这个特殊对象作为参数会传入 createVNode()  创建虚拟dom
     */
    // 传入vnode，递归对一个组件或者普通元素进行拆箱，在内部对vnode的type判断执行不同的处理函数
    function patch(vnode, container, parentComponent) {
        // 检查是什么类型的vnode
        const { type } = vnode;
        switch (type) {
            case Fragment:
                processFragment(vnode, container, parentComponent);
                break;
            case Text:
                processText(vnode, container);
                break;
            default: {
                // & 左右两边同时为1 则为1   可以应用在 0001 & 0010 判断指定的位置是否为1  这个案例会输出0000  所以为false 指定的位置并没有相同
                if (vnode.shapeFlag & 1 /* ELEMENT */) {
                    // 是一个普通元素？处理vnode是普通标签的情况
                    processElement(vnode, container, parentComponent);
                }
                else if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 是一个组件？处理vnode是组件的情况
                    processComponent(vnode, container, parentComponent);
                }
                break;
            }
        }
    }
    function processText(vnode, container) {
        mountText(vnode, container);
    }
    function processFragment(vnode, container, parentComponent) {
        mountChildren(vnode, container, parentComponent);
    }
    // 处理组件的情况
    function processComponent(vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    }
    // 处理元素的情况
    function processElement(vnode, container, parentComponent) {
        mountElement(vnode, container, parentComponent);
    }
    // 最后，它把setup()的返回值挂载在组件的instance的setupState上
    // instance.type的render()函数挂载在组件的instance的render上
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        // 安装组件
        setupComponent(instance);
        //
        setupRenderEffect(instance, vnode, container);
    }
    function mountElement(vnode, container, parentComponent) {
        // 注意：这个vnode并非是组件的vnode，而是HTML元素的vnode
        const el = (vnode.el = createElement(vnode.type));
        let { children, props } = vnode;
        // 子节点是文本节点
        if (vnode.shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
            // 子节点是数组
        }
        else if (vnode.shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        let val;
        // 对vnode的props进行处理，把虚拟属性添加到el
        for (let key of Object.getOwnPropertyNames(props).values()) {
            val = props[key];
            patchProp(el, key, val);
        }
        // insert操作
        insert(el, container);
    }
    function mountText(vnode, container) {
        const { children } = vnode;
        const textNode = (vnode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((vnode) => {
            patch(vnode, container, parentComponent);
        });
    }
    function setupRenderEffect(instance, vnode, container) {
        effect(() => {
            // 通过一个变量isMounted区分是初始化还是更新
            if (!instance.isMounted) {
                // 这个render()已经在finishComponentSetup处理过了，就是 instance.type.render() 特殊对象的render()
                // render函数内部的this指向 修改为 setupStatefulComponent中定义的proxy对象
                const subTree = instance.render.call(instance.proxy);
                // 对子树进行拆箱操作 递归进去
                patch(subTree, container, instance);
                // 代码到了这里，组件内的所有element已经挂在到document里面了
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('updated');
            }
        });
    }
    return {
        createApp: createAppAPI(render),
        render,
    };
}

function h(type, props, children) {
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

function createElement(type) {
    console.log('createElement-----------');
    return document.createElement(type);
}
function patchProp(el, key, value) {
    console.log('patchProp-----------');
    if (Array.isArray(value)) {
        el.setAttribute(key, value.join(' '));
    }
    else if (isOn(key) && isFunction(value)) {
        // 添加事件
        el.addEventListener(key.slice(2).toLowerCase(), value);
    }
    else {
        el.setAttribute(key, value);
    }
}
function insert(el, container) {
    console.log('insert-----------');
    container.append(el);
}
const render = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    // @ts-ignore
    return render.createApp(...args);
}

export { ReactiveFlags, computed, createApp, createElement, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, insert, isProxy, isReactive, isReadonly, isRef, isShallow, patchProp, provide, proxyRefs, reactive, readonly, ref, renderSlot, shallowReactive, shallowReadonly, stop, toRaw, track, trackEffect, trigger, triggerEffect, unref };
//# sourceMappingURL=guide-toy-vue3.esm.js.map
