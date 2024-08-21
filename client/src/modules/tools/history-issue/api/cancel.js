import axios from 'axios'
import { handleApiError } from '@/api/errorHandler'

const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_BASE_URL })

function handleResponse(response) {
  return response.data
}

export const issueHistoryApi = {
  fetchHistoryByPartId: async (partId) =>
    axiosInstance
      .get(`/history-part`, { params: { id_part: partId } })
      .then(handleResponse)
      .catch(handleApiError),

  // Получить историю инструмента
  fetchToolHistory: async (
    search = '',
    page = 1,
    limit = 100,
    includeNull = false,
    parentId = null
  ) => {
    const params = { search, page, limit, includeNull }
    if (parentId !== null) params.parent_id = parentId

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
}
