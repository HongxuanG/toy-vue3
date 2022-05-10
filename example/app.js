import { h } from '../lib/guide-toy-vue3.esm.js'
export default {
  render() {
    // TODO: this implement
    return h('div', {
      id: 'root',
      class: ['flex', 'container-r']
    }, [
      h('p', {class: 'red'}, 'red'),
      h('p', {class: 'blue'}, 'blue')
    ])
  },
  setup() {
    // 返回对象或者h()渲染函数
    return {
      name: 'hi my app'
    }
  }
}
