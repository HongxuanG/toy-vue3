import { h } from '../../lib/guide-toy-vue3.esm.js'
import Foo from './Foo.js'


window.self = null
export default {
  name: 'App',
  render() {
    // 为什么这里不直接写window.self = this.$el呢？因为h还没执行，元素还没mount上document，借助引用传递拿到值
    window.self = this
    return h('div', {
      id: 'root',
      class: ['flex', 'container-r'],
      onClick(){
        console.log('click event!')
      },
      onMouseDown(){
        console.log('mouse down!')
      }
    }, [
      h('p', {class: 'red'}, 'red'),
      h('p', {class: 'blue'}, 'blue'),
      // 在Foo的props中寻找有没有on + emitFooAddEvent这个函数，有就执行
      h(Foo, {
        count: 1,
        onEmitFooAddEvent: this.takeEmitEvent
      }, '')
    ])
    // this指向通过proxy
    return h('div', {
      id: 'root',
      class: ['flex', 'container']
    }, this.name)
  },
  setup() {
    function takeEmitEvent(count){
      console.log('app take in count number:', count)
    }
    // 返回对象或者h()渲染函数
    return {
      name: 'hi my app',
      takeEmitEvent
    }
  }
}
