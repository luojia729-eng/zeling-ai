import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', name: 'Home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
      { path: 'create', name: 'Create', component: () => import('@/views/Create.vue'), meta: { title: '性价比创作' } },
      { path: 'canvas', name: 'Canvas', component: () => import('@/views/Canvas.vue'), meta: { title: '无限画布' } },
      { path: 'api-access', name: 'ApiAccess', component: () => import('@/views/ApiAccess.vue'), meta: { title: 'API接入' } },
      { path: 'settings', name: 'Settings', component: () => import('@/views/Settings.vue'), meta: { title: '设置' } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '则灵 AI'} - 聚合多模型 AI 创作平台`
  next()
})

export default router
