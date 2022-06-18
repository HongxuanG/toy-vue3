import { h, ref } from '../../lib/guide-toy-vue3.esm.js'

export default {
  name: 'arrayToArray',
  setup(){
    const isChange = ref(false)
    window.isChange = isChange
    return {
      isChange,
    }
  },
  render(){
    // 删除了F
    return this.isChange ? h('div', {}, [
      h('div', {}, 'A'),
      h('div', {}, 'B'),
      h('div', {}, 'C'),
      h('div', {}, 'D'),
      h('div', {}, 'E'),
      h('div', {}, 'F'),
    ]) :
    h('div',{},[
      h('div',{},'A'),
      h('div',{},'B'),
      h('div',{},'C'),
      h('div',{},'D'),
      h('div',{},'E'),
    ])
  }
}
