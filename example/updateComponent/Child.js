import { h } from "../../lib/guide-toy-vue3.esm.js"

export default {
  name: 'Child',
  setup(){
    return {

    }
  },
  render(){
    return h('div',{}, [
      h('div', {}, this.$props.msg)
    ])
  }
}
