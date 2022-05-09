import {h} from '../lib/guide-toy-vue3-esm.js'
export default {
  render(){
    return h('div', {}, this.name)
  },
  setup(){
    // 返回对象或者h()渲染函数
    return {
      name: 'hi my app'
    }
  }
}
