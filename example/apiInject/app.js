import { h, provide, inject } from '../../lib/guide-toy-vue3.esm.js'

const Provider = {
  name: 'Provider',
  setup(){

    provide('foo', 'fooVal')
    provide('bar', 'barVal')
  },
  render(){
    return h('div', {}, [
      h('p', {}, 'Provider'),
      h(Consumer)
    ])
  }
}
const Consumer = {
  name: 'Consumer',
  setup(){
    const fooVal = inject('foo', 'fooDefault')
    const barVal = inject('bar', 'barDefault')
    return {
      fooVal,
      barVal
    }
  },
  render(){
    return h('div', {}, `Consumer-${this.fooVal}-${this.barVal}`)
  }
}
