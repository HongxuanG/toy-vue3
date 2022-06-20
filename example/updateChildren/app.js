import { ref, h, reactive } from '../../lib/guide-toy-vue3.esm.js'
import textToText from './textToText.js'
import textToArray from './textToArray.js'
import arrayToText from './arrayToText.js'
import arrayToArray from './arrayToArray.js'
export const App = {
  name: 'app',
  setup() {},
  render() {
    
    // this.count进行依赖收集，
    return h('div', {}, [
      h('p',{},'主页'),
      // 旧的是文本 新的是文本
      // h(textToText),
      // 旧的是文本 新的是数组
      // h(textToArray),
      // 旧的是数组 新的是文本
      // h(arrayToText),
      // 旧的是数组 新的也是数组
      h(arrayToArray),
    ])
  },
}
