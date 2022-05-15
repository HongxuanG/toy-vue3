import { h, renderSlots } from '../../lib/guide-toy-vue3.esm.js'

export default {
  name: 'Foo',
  render() {
    console.log(this.$slots)
    const foo = h('p', {}, '原本就在Foo里面的元素')
    // return h('div', {}, [renderSlots(this.$slots, 'header', {age: 11}), foo, renderSlots(this.$slots, 'footer')])
    return h('div', {}, [renderSlots(this.$slots), foo])
  },
  setup(props, {emit}) {
    
  }
}
