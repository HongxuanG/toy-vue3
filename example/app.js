import { h } from '../lib/guide-toy-vue3.esm.js'
window.self = null
export default {
  render() {
    // 为什么这里不直接写window.self = this.$el呢？因为h还没执行，元素还没mount上document，借助引用传递拿到值
    window.self = this
    return h('div', {
      id: 'root',
      class: ['flex', 'container-r']
    }, [
      h('p', {class: 'red'}, 'red'),
      h('p', {class: 'blue'}, 'blue')
    ])
    // this指向通过proxy
    return h('div', {
      id: 'root',
      class: ['flex', 'container']
    }, this.name)
  },
  setup() {
    // 返回对象或者h()渲染函数
    return {
      name: 'hi my app'
    }
  }
}
