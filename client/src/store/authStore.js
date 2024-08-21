// store/modules/authStore.js
import { axiosInstance } from '@/api/axiosConfig'

const authStore = {
  namespaced: true,
  state: {
    isAuthorized: false,
    userRole: null,
  },
  mutations: {
    SET_AUTHORIZED(state, isAuthorized) {
      state.isAuthorized = isAuthorized
    },
    SET_USER_ROLE(state, role) {
      state.userRole = role
    },
  },
  actions: {
    async login({ commit }, { login, password }) {
      try {
        const response = await axiosInstance.post('/login', { login, password })
        if (response.data.status === 'ok') {
          localStorage.setItem('token', response.data.token)
          commit('SET_AUTHORIZED', true)
          commit('SET_USER_ROLE', response.data.role)
          return true // Успешный вход
        } else {
          return false // Неправильный логин или пароль
        }
      } catch (error) {
        console.error('Login error:', error)
        throw new Error('Ошибка авторизации')
      }
    },
    logout({ commit }) {
      localStorage.removeItem('token')
      commit('SET_AUTHORIZED', false)
      commit('SET_USER_ROLE', null)
    },
  },
}

export default authStore
