import Vue from 'vue'
import Router from 'vue-router'
import EditorView from '@/views/EditorView.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'EditorView',
      component: EditorView
    }
  ]
})
