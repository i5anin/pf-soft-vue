import axios from 'axios'
import { handleApiError } from '@/api/errorHandler'
import { getBaseUrl } from '@/api/axiosConfig'

const axiosInstance = axios.create({ baseURL: getBaseUrl('laravel') })

function handleResponse(response) {
  return response.data
}

export const QrCodeApi = {
  getQrCodeData: async (page, perPage) => {
    return axiosInstance
      .get('/qr-code', { params: { page, perPage } })
      .then(handleResponse)
      .catch(handleApiError)
  },

  addQrCodeData: async () => {
    return axiosInstance
      .post('/qr-code')
      .then(handleResponse)
      .catch(handleApiError)
  },
}
