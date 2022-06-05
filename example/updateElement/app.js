import { ref, h } from '../../lib/guide-toy-vue3.esm.js'
export const App = {
  name: 'app',
  setup() {
    const count = ref(0)
    const click = () => {
      count.value++
    }
    return {
      count,
      click,
    }
  },
  render() {
    return h('div', {}, [
      h('p', {}, `count: ${this.count}`),
      h('button', { onClick: this.click }, '点击更新'),
    ])
  },
}
