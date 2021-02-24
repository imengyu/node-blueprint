import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Toasted from 'vue-toasted';
import Contextmenu from "vue-contextmenujs/dist/contextmenu.umd.js"
import { HappyScroll } from 'vue-happy-scroll/src'
import ElementUI from 'element-ui';

// 引入css
import 'element-ui/lib/theme-chalk/index.css';
import 'vue-happy-scroll/docs/happy-scroll.css'
import "./assets/css/iconfont.css"
import "./assets/sass/main.scss" 
import "./utils/BaseExtends"

Vue.component('happy-scroll', HappyScroll)
Vue.use(ElementUI);
Vue.use(Toasted)
Vue.use(Contextmenu);
Vue.config.productionTip = false

var bus = new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
}).$mount("#app")

document.addEventListener("dragover", function(event) {
  // prevent default to allow drop
  event.preventDefault();
}, false);

(<any>window).$bus = bus;

export default bus;