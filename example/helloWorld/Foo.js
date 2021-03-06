import { h, getCurrentInstance } from '../../lib/guide-toy-vue3.esm.js'

export default {
  name: 'Foo',
  render() {
    // 2. 能在render中通过this访问到props
    return h('div', {}, 'foo: ' + this.count)
  },
  setup(props) {
    // 1. 传入count
    console.log(props)
    // 3. shallow readonly
    props.count++
    console.log(props)
    console.log('', getCurrentInstance());
  }
}
