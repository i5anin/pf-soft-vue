import { axiosInstance } from '@/api/axiosConfig'
import { handleApiError, handleResponse } from '@/api/errorHandler'

export async function getToolParams() {
  return axiosInstance
    .get('/tools-params')
    .then(handleResponse)
    .catch(handleApiError)
}
