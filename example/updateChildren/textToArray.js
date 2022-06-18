import { h, ref } from '../../lib/guide-toy-vue3.esm.js'

export default {
  name: 'textToArray',
  setup() {
    const isChange = ref(false)
    window.isChange = isChange
    return {
      isChange,
    }
  },
  render() {
    return this.isChange
      ? h('div', {}, [h('p', {}, 'p标签'), h('span', {}, 'span标签')])
      : h('div', {}, 'old text')
  },
}
