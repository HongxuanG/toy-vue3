import Child from './Child.js'
import { ref, h } from '../../lib/guide-toy-vue3.esm.js'
export const App = {
  name: 'app',
  setup() {
    const msg = ref('hello')
    const changeMsg = () => {
      msg.value = 'world'
    }
    return {
      msg,
      changeMsg
    }
  },
  render() {
    return h('div', {}, [
      h('div', {}, 'hello world'),
      h(Child, {msg: this.msg}),
      h('button', {onClick: this.changeMsg}, '改变msg')
    ])
  },
}
