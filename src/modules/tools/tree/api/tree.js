import { handleApiError } from '@/api/errorHandler'
import { axiosInstance } from '@/api/axiosConfig'

function handleResponse(response) {
  return response.data
}

export const toolTreeApi = {
  getTree: async () =>
    axiosInstance.get('/tools-tree').then(handleResponse).catch(handleApiError),
  addFolder: async (name, parentId) =>
    axiosInstance
      .post('/tools-tree', { name, parentId })
      .then(handleResponse)
      .catch(handleApiError),
  deleteFolder: async (itemId) =>
    axiosInstance.delete(`/tools-tree/${itemId}`).catch(handleApiError),
  renameFolder: async (id, newName) =>
    axiosInstance
      .put('/tools-tree', { id, newName })
      .then(handleResponse)
      .catch(handleApiError),
}
