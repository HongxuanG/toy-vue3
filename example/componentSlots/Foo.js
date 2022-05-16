import { h, renderSlot, createTextVNode } from '../../lib/guide-toy-vue3.esm.js'

export default {
  name: 'Foo',
  render() {
    console.log('Foo--->', this.$slots)
    const foo = h('p', {}, '原本就在Foo里面的元素')
    // return h('div', {}, [renderSlot(this.$slots, 'header', {age: 11}), foo, renderSlot(this.$slots, 'footer')])
    // return h('div', {}, [renderSlot(this.$slots, 'default'), foo])
    return h('div', {}, [foo, renderSlot(this.$slots, 'default'), createTextVNode('aaa')])
  },
  setup(props, {emit}) {
    
  }
}
