
import { ref, h,getCurrentInstance } from '../../lib/guide-toy-vue3.esm.js'
export const App = {
  name: 'app',
  setup() {
    const instance = getCurrentInstance()
    const count = ref(0)
    const changeCount = () => {

      for(let i = 0;i<100;i++){
        console.log('update count');
        count.value = i
      }
      console.log('当前实例',instance)
    }
    return {
      changeCount,
      count
    }
  },
  render() {
    console.log(this);
    return h('div', {}, [
      
      h('button', {onClick: this.changeCount}, 'update'),
      h('p', {}, 'count:' + this.count)
    ])
  },
}
