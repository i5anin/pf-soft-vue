import { handleApiError } from '@/api/errorHandler'
import axiosInstance from '@/api/axiosConfig'

function handleResponse(response) {
  return response.data
}

export const editorToolApi = {
  // Добавить новый инструмент
  addTool: async (toolData) =>
    axiosInstance
      .post('/tool', toolData)
      .then(handleResponse)
      .catch(handleApiError),

  // Удалить инструмент по ID
  deleteTool: async (id) =>
    axiosInstance
      .delete(`/tool/${id}`)
      .then(handleResponse)
      .catch(handleApiError),

  // Обновить существующий инструмент
  updateTool: async (id, toolData) =>
    axiosInstance
      .put(`/tool/${id}`, toolData)
      .then(handleResponse)
      .catch(handleApiError),

  // Получить параметры инструмента по parent_id
  getToolParamsByParentId: async (parentId) =>
    axiosInstance
      .get(`/tools-params/${parentId}`)
      .then(handleResponse)
      .catch(handleApiError),
  // В editorToolApi объекте
  getToolNamesByParentId: async (parentId) =>
    axiosInstance
      .get(`/tools-params-name/${parentId}`)
      .then(handleResponse)
      .catch(handleApiError),

  // Получить движение инструмента по ID
  getToolMovementById: async (toolId) =>
    axiosInstance
      .get(`/tool-movement/${toolId}`)
      .then(handleResponse)
      .catch(handleApiError),
}
