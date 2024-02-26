import { createRouter, createWebHistory } from 'vue-router'
import IdeTest from '../views/IdeTest.vue'
import EditorTest from '../views/EditorTest.vue'
import CodeLayoutTest from '../views/CodeLayoutTest.vue'
import CodeScrollTest from '../views/CodeScrollTest.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'ide',
      component: IdeTest
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorTest
    },
    {
      path: '/code-layout',
      name: 'codelayout',
      component: CodeLayoutTest
    },
    {
      path: '/code-scroll',
      name: 'codelayoutScroll',
      component: CodeScrollTest
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
