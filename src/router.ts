import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  // 与 Vite 的 base 保持一致，部署到 GitHub Pages 子路径时路由仍能正确匹配
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'practice',
      component: () => import('@/views/PracticeView.vue'),
    },
    {
      path: '/progress',
      name: 'progress',
      component: () => import('@/views/ProgressView.vue'),
    },
    {
      path: '/reference',
      name: 'reference',
      component: () => import('@/views/ReferenceView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
