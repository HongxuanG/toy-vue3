import {
  h
} from '../../lib/guide-toy-vue3.esm.js'
import Foo from './Foo.js'


export default {
  name: 'App',
  render() {
    return h('div', {
      id: 'root',
      class: ['flex', 'container-r'],
    }, [
      h('p', {
        class: 'red'
      }, 'red'),
      h('p', {
        class: 'blue'
      }, this.name),
      h(Foo, {}, [h('p', {}, '我是slot1'), h('p', {}, '我是slot1')])
      // h(Foo, {}, {
      //   default: () => h('p', {}, '我是slot1')
      // })
      // 具名插槽
      // h(Foo, {}, {
      //   header: h('p', {}, '我是header slot1'),
      //   footer: h('p', {}, '我是footer slot1')
      // })
      // 作用域插槽
      // h(Foo, {}, {
      //   header: ({age})=>h('p', {}, '我是header slot1'+age),
      //   footer: ()=>h('p', {}, '我是footer slot1')
      // })
    ])
  },
  setup() {
    // 返回对象或者h()渲染函数
    return {
      name: 'hi my app',
    }
  }
}
