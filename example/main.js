import App from './app'
import {createApp} from '../src/runtime-core'

// 流程：
// template -> render() -> 生成vnode —> mountElement -> insert #app

const app = createApp(App)

app.mount(document.querySelector('#app'))
