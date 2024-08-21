// api/authApi.js
import { axiosInstance } from '@/api/axiosConfig'
import { handleApiError } from '@/api/errorHandler'

function handleResponse(response) {
  return response.data
}

export const authApi = {
  // Проверка авторизации пользователя
  checkLogin: async () => {
    const token = localStorage.getItem('token') // Получение токена из локального хранилища
    return axiosInstance
      .post('/check-login', { token }) // Отправка токена на сервер для проверки
      .then(handleResponse)
      .catch(handleApiError)
  },

  // Выполнение входа пользователя
  login: async (loginData) => {
    return axiosInstance
      .post('/login', loginData)
      .then(handleResponse)
      .catch(handleApiError)
  },
}
