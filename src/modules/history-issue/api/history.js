import axios from 'axios'
import { handleApiError } from '@/api/errorHandler'

const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_BASE_URL })

function handleResponse(response) {
  return response.data
}
// id партии
export const issueHistoryApi = {
  fetchHistoryByPartId: async (partId, selectedDate) =>
    axiosInstance
      .get(`/history-part`, {
        params: { id_part: partId, selectedDate: selectedDate },
      })
      .then(handleResponse)
      .catch(handleApiError),

  fetchHistoryByPartIdInfo: async (partId, selectedDate) =>
    axiosInstance
      .get(`/history-part/info`, {
        params: { id_part: partId, selectedDate: selectedDate },
      })
      .then(handleResponse)
      .catch(handleApiError),

  // Обновленная функция для получения истории инструмента с учетом даты
  fetchToolHistory: async (
    search = '',
    page = 1,
    limit = 100,
    date = '' // Добавляем новый параметр для даты
  ) => {
    const params = { search, page, limit, date } // Добавляем date в параметры запроса

    return axiosInstance
      .get('/history', { params })
      .then(handleResponse)
      .catch(handleApiError)
  },

  cancelOperation: async (operationId, token, quantity) => {
    return axiosInstance
      .post(`/issue/cancel-operation/${operationId}`, {
        issueToken: token,
        cancelQuantity: quantity,
      })
      .then(handleResponse)
      .catch(handleApiError)
  },

  // Новый маршрут для получения идентификаторов инструмента с именами
  getAllIssuedToolIdsWithNames: async () =>
    axiosInstance
      .get('history-all-tool')
      .then(handleResponse)
      .catch(handleApiError),

  // Новый метод для добавления записи в архив
  addToArchive: async (partId) =>
    axiosInstance
      .post(`/history-add-archive`, { id_part: partId })
      .then(handleResponse)
      .catch(handleApiError),
}
