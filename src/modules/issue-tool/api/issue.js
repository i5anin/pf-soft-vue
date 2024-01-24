import axios from 'axios'
import { handleApiError } from '@/api/errorHandler'

const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_BASE_URL })

function handleResponse(response) {
  return response.data
}

export const issueToolApi = {
  //получить fio
  getDetailFio: async () =>
    axiosInstance
      .get('operators/fio')
      .then(handleResponse)
      .catch(handleApiError),

  //получить detail по id
  searchById: async (id) =>
    axiosInstance
      .get('detail/id', { params: { id } })
      .then(handleResponse)
      .catch(handleApiError),

  // Функция для отправки данных об инструменте
  addHistoryTool: async (toolData) =>
    axiosInstance
      .post('issue', toolData)
      .then(handleResponse)
      .catch(handleApiError),

  fetchCncList: async () =>
    axiosInstance.get('cnc').then(handleResponse).catch(handleApiError),
}
