// src/router/index.js или src/index.js

import { createRouter, createWebHistory } from 'vue-router'

export const Routes = {
  LOGIN: '/Login',
}

const routes = [
  {
    path: Routes.LOGIN,
    name: 'Login',
    component: () => import('@/views/Login.vue'), // Ленивая загрузка
  },
  {
    path: '/Tool',
    name: 'Tool',
    component: () => import('@/modules/tools/_tabs/components/Tabs.vue'), // Ленивая загрузка
  },
  {
    path: '/QR-code',
    name: 'QR-code',
    component: () => import('@/modules/qr-code/main/components/Table.vue'), // Ленивая загрузка
  },
  {
    path: '/',
    redirect: '/Tool',
  },
  {
    path: '/:catchAll(.*)',
    name: 'Error404',
    component: () => import('@/views/404.vue'), // Ленивая загрузка
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Охранник маршрутов
router.beforeEach((to, from, next) => {
  const isAuthorized = !!localStorage.getItem('token')

  if (!isAuthorized && to.path !== Routes.LOGIN) {
    next({ path: Routes.LOGIN })
  } else if (isAuthorized && to.path === Routes.LOGIN) {
    next({ path: '/' }) // Если пользователь уже авторизован и пытается перейти на страницу входа, перенаправляем на главную
  } else {
    next() // Во всех остальных случаях выполняем переход на запрашиваемый маршрут
  }
})

export default router
