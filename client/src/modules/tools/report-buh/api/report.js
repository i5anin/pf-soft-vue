import { handleApiError } from '@/api/errorHandler'
import { axiosInstance } from '@/api/axiosConfig'

function handleResponse(response) {
  return response.data
}

export const reportApi = {
  getBuchWeek: async () =>
    axiosInstance
      .get('/report/getBuchWeek')
      .then(handleResponse)
      .catch(handleApiError),
}
