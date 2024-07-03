import { handleApiError } from '@/api/errorHandler'
import { axiosInstance } from '@/api/axiosConfig'

function handleResponse(response) {
  return response.data
}

export const toolParamApi = {
  // Обновить параметр инструмента
  updateToolParam: async (id, updatedParam) =>
    axiosInstance
      .put(`/tools-params/${id}`, updatedParam)
      .then(handleResponse)
      .catch(handleApiError),

  // Удалить параметр инструмента
  deleteToolParam: async (id) =>
    axiosInstance
      .delete(`/tools-params/${id}`)
      .then(handleResponse)
      .catch(handleApiError),

  // Добавить новый параметр инструмента
  addToolParam: async (newParam) =>
    axiosInstance
      .post(`/tools-params`, newParam)
      .then(handleResponse)
      .catch(handleApiError),

  // Переместить параметр инструмента
  moveToolParam: async (id, direction) =>
    axiosInstance
      .patch(`/tools-params/${id}/move`, { action: direction })
      .then(handleResponse)
      .catch(handleApiError),
}
