import { handleApiError } from '@/api/errorHandler'
import { axiosInstance } from '@/api/axiosConfig'

function handleResponse(response) {
  return response.data
}

export const toolGroupsApi = {
  // Удалить параметр инструмента
  getToolGroups: async () =>
    axiosInstance
      .get(`/tools-groups`)
      .then(handleResponse)
      .catch(handleApiError),
}
