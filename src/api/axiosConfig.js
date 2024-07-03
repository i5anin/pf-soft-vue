// axiosConfig.js
import axios from 'axios'

const getBaseUrl = (serverType) => {
  switch (serverType) {
    case 'node':
      return import.meta.env.VITE_BASE_URL || 'http://localhost:4000/api'
    case 'laravel':
      return import.meta.env.VITE_BASE_URL_LARAVEL || 'http://localhost:8000/api'
    default:
      return 'http://localhost:4000/api' // Введите значение по умолчанию или выбросите ошибку
  }
}

// Создание экземпляров Axios для каждого типа сервера
const axiosInstance = axios.create({ baseURL: getBaseUrl('node') })
const axiosInstanceLaravel = axios.create({ baseURL: getBaseUrl('laravel') })

// Экспорт обоих экземпляров
export { axiosInstance, axiosInstanceLaravel }
