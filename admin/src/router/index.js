import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'users', name: 'Users', component: () => import('../views/Users.vue') },
      { path: 'express-orders', name: 'ExpressOrders', component: () => import('../views/ExpressOrders.vue') },
      { path: 'errand-tasks', name: 'ErrandTasks', component: () => import('../views/ErrandTasks.vue') },
      { path: 'carpool', name: 'Carpool', component: () => import('../views/Carpool.vue') },
      { path: 'market-goods', name: 'MarketGoods', component: () => import('../views/MarketGoods.vue') },
      { path: 'forum-posts', name: 'ForumPosts', component: () => import('../views/ForumPosts.vue') },
      { path: 'team-activities', name: 'TeamActivities', component: () => import('../views/TeamActivities.vue') },
      { path: 'skills', name: 'Skills', component: () => import('../views/Skills.vue') },
      { path: 'food', name: 'FoodManage', component: () => import('../views/FoodManage.vue') },
      { path: 'wash', name: 'WashManage', component: () => import('../views/WashManage.vue') },
      { path: 'withdrawals', name: 'Withdrawals', component: () => import('../views/Withdrawals.vue') },
      { path: 'messages', name: 'Messages', component: () => import('../views/Messages.vue') },
      { path: 'site-config', name: 'SiteConfig', component: () => import('../views/SiteConfig.vue') },
      { path: 'stats', name: 'Stats', component: () => import('../views/Stats.vue') }
    ]
  }
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to, from, next) => {
  if (to.path === '/login') return next()
  const auth = useAuthStore()
  if (!auth.isLoggedIn) return next('/login')
  next()
})

export default router
