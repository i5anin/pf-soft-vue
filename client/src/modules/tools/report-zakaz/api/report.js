import { handleApiError } from '@/api/errorHandler'
import { axiosInstance } from '@/api/axiosConfig'

function handleResponse(response) {
  return response.data
}

export const reportApi = {
  genBuchWeek: async () =>
    axiosInstance
      .get('/report/buch-week')
      .then(handleResponse)
      .catch(handleApiError),
  getToolMovementById: async (toolId) =>
    axiosInstance
      .get(`/tool-movement/${toolId}`)
      .then(handleResponse)
      .catch(handleApiError),
  genNalad: async (token) =>
    axiosInstance
      .get('/report/setup', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(handleResponse)
      .catch(handleApiError),
  genZayavInstr: async (token) =>
    axiosInstance
      .get('/report/zayav-instr', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(handleResponse)
      .catch(handleApiError),
  genRevisionInstr: async (token) =>
    axiosInstance
      .get('/report/revision-instr', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(handleResponse)
      .catch(handleApiError),
  getZakaz: async () =>
    axiosInstance
      .get('/report/get-zakaz')
      .then(handleResponse)
      .catch(handleApiError),
}
