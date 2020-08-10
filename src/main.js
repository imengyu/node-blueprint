// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import "./assets/css/iconfont.css"
import "./assets/sass/main.scss" 
import "./utils/BaseExtends"
import 'iview/dist/styles/iview.css';
import iView from 'iview';
import Contextmenu from "vue-contextmenujs/dist/contextmenu.umd"

Vue.use(Contextmenu);
Vue.use(iView);
Vue.config.productionTip = false
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
