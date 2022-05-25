import { h, provide, inject } from '../../lib/guide-toy-vue3.esm.js'

export const Provider = {
  name: 'Provider',
  setup(){

    provide('foo', 'fooVal')
    provide('bar', 'barVal')
  },
  render(){
    return h('div', {}, [
      h('p', {}, 'Provider'),
      h(ProviderTwo)
    ])
  }
}
const ProviderTwo = {
  name: 'ProviderTwo',
  setup(){
    provide('foo', 'fooTwo')
    provide('bar', 'barTwo')
    // 期望得到provider的foo---fooVal，实际上得到的是fooTwo
    const foo = inject('foo')
    const bar = inject('bar')
    return {
      foo,
      bar
    }
  },
  render(){
    return h('div', {}, [
      h('p', {}, `ProviderTwo-${this.foo}-${this.bar}`),
      h(Consumer)
    ])
  }
}
const Consumer = {
  name: 'Consumer',
  setup(){
    const fooVal = inject('foo')
    const barVal = inject('bar')
    return {
      fooVal,
      barVal
    }
  },
  render(){
    return h('div', {}, `Consumer-${this.fooVal}-${this.barVal}`)
  }
}
