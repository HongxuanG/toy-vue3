import App from './app.js'
import {createApp} from '../lib/guide-toy-vue3-esm.js'

// 流程：
// template -> render() -> 生成vnode —> mountElement -> insert #app

const app = createApp(App)

app.mount(document.querySelector('#app'))
