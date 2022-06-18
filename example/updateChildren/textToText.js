import { h, ref } from '../../lib/guide-toy-vue3.esm.js'

export default {
  name: 'textToText',
  setup(){
    const isChange = ref(false)
    window.isChange = isChange
    return {
      isChange,
    }
  },
  render(){
    return this.isChange ? h('div', {}, 'new text') : h('div', {}, 'old text')
  }
}
