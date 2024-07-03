import axios from 'axios'
import { handleApiError } from '@/api/errorHandler'

const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_BASE_URL })

function handleResponse(response) {
  return response.data
}

export const damagedHistoryApi = {
  fetchDamagedHistory: async () => {
    return axiosInstance
      .get('/damaged-history')
      .then(handleResponse)
      .catch(handleApiError)
  },
}
