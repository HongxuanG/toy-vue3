import Child from './Child.js'
import { ref, h } from '../../lib/guide-toy-vue3.esm.js'
export const App = {
  name: 'app',
  setup() {
    const msg = ref('hello')
    const count = ref(0)
    const changeMsg = () => {
      msg.value = 'world'
    }
    const changeCount = () => {
      count.value++
    }
    return {
      msg,
      count,
      changeMsg,
      changeCount
    }
  },
  render() {
    console.log(this);
    return h('div', {}, [
      h('div', {}, 'hello world'),
      h(Child, {msg: this.msg}),
      h('button', {onClick: this.changeMsg}, '改变msg'),
      h('button', {onClick: this.changeCount}, '改变count，看看有没有触发updateComponent'),
      h('p', {}, 'count:' + this.count)
    ])
  },
}
