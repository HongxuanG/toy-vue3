import { ref, h, reactive } from '../../lib/guide-toy-vue3.esm.js'
export const App = {
  name: 'app',
  setup() {
    const count = ref(0)
    let props = ref({
      foo: 'foo',
      bar: 'bar',
    })
    const click = () => {
      // 触发依赖
      count.value++
    }
    const changePropsDemo1 = () => {
      props.value.foo = 'new foo'
    }
    const changePropsDemo2 = () => {
      props.value.foo = undefined
    }
    const changePropsDemo3 = () => {
      props.value = {
        foo: 'foo'
      }
    }
    return {
      count,
      click,
      props,
      changePropsDemo1,
      changePropsDemo2,
      changePropsDemo3,
    }
  },
  render() {
    // this.count进行依赖收集，
    return h('div', { id: 'update', ...this.props }, [
      h('p', {}, `count: ${this.count}`),
      h('button', { onClick: this.click }, '点击更新'),
      h('button', { onClick: this.changePropsDemo1 }, '比较props，更新props'),
      h(
        'button',
        { onClick: this.changePropsDemo2 },
        'props属性值赋值为null或undefined，应该删除该属性'
      ),
      h(
        'button',
        { onClick: this.changePropsDemo3 },
        '新props属性被删除，也应该删除该属性'
      ),
    ])
  },
}
