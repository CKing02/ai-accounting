import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/pages/home/index.vue'),
        meta: { title: '首页' }
      },
      {
        path: '/accounts',
        name: 'Accounts',
        component: () => import('@/pages/accounts/index.vue'),
        meta: { title: '账户管理' }
      },
      {
        path: '/records',
        name: 'Records',
        component: () => import('@/pages/records/index.vue'),
        meta: { title: '记账记录' }
      },
      {
        path: '/reports',
        name: 'Reports',
        component: () => import('@/pages/reports/index.vue'),
        meta: { title: '消费报告' }
      },
      {
        path: '/budget',
        name: 'Budget',
        component: () => import('@/pages/budget/index.vue'),
        meta: { title: '预算管理' }
      },
      {
        path: '/ai',
        name: 'AI',
        component: () => import('@/pages/ai/index.vue'),
        meta: { title: 'AI理财管家' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/pages/settings/index.vue'),
        meta: { title: '设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
