import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import AboutView from '../views/AboutView.vue'
import EditorView from '../views/EditorView.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'EditorView',
    component: EditorView
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    // component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL || '/',
  routes
})

export default router
