// store/authStore.js
import { defineStore } from 'pinia'
import { axiosInstance } from '@/api/axiosConfig'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    isAuthorized: false,
    userRole: null,
  }),
  actions: {
    async login({ login, password }) {
      try {
        const response = await axiosInstance.post('/login', { login, password })
        if (response.data.status === 'ok') {
          localStorage.setItem('token', response.data.token)
          this.isAuthorized = true
          this.userRole = response.data.role
          return true // Успешный вход
        } else {
          return false // Неправильный логин или пароль
        }
      } catch (error) {
        console.error('Login error:', error)
        throw new Error('Ошибка авторизации')
      }
    },
    logout() {
      localStorage.removeItem('token')
      this.isAuthorized = false
      this.userRole = null
    },
  },
})
