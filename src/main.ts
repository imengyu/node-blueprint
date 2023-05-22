import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css';
import TooltipDirective from './node-blueprint/Editor/Nana/Tooltip/TooltipDirective';


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(TooltipDirective)

app.mount('#app')
