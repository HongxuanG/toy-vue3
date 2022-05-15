import { h } from '../../lib/guide-toy-vue3.esm.js'

export default {
  name: 'Foo',
  render() {
    
    return h('div', {}, [
      h('button', {
        onClick: this.onAdd
      }, '触发emit')
    ])
  },
  setup(props, {emit}) {
    // 1. 传入count
    console.log(props)
    // 3. shallow readonly
    props.count++
    console.log(props, props.count)
    function onAdd(){
      console.log('onAdd')
      emit('emitFooAddEvent', props.count)
    }
    
    return {
      onAdd
    }
  }
}
