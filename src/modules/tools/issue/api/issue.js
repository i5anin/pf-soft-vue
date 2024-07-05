import axios from 'axios'
import { handleApiError } from '@/api/errorHandler'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
})

function handleResponse(response) {
  return response.data
}

export const issueToolApi = {
  //получить fio
  getDetailFio: async () =>
    axiosInstance
      .get('modal-form/operators/fio')
      .then(handleResponse)
      .catch(handleApiError),

  //получить detail по id
  searchById: async (id) =>
    axiosInstance
      .get('modal-form/parties', { params: { id } })
      .then(handleResponse)
      .catch(handleApiError),

  fetchCncList: async () =>
    axiosInstance
      .get('modal-form/cnc')
      .then(handleResponse)
      .catch(handleApiError),

  // Функция для отправки данных об инструменте
  addHistoryTool: async (toolData) =>
    axiosInstance
      .post('issue', toolData)
      .then(handleResponse)
      .catch(handleApiError),

  addHistoryTools: async (toolData) =>
    axiosInstance
      .post('issues', toolData)
      .then(handleResponse)
      .catch(handleApiError),

  // Функция для отправки данных о поврежденном инструменте
  addToolHistoryDamaged: async (damagedData) =>
    axiosInstance
      .post('tool-history-damaged', damagedData)
      .then(handleResponse)
      .catch(handleApiError),

  // Получить историю по операции
  getToolHistoryByOperationId: async (operationId) =>
    axiosInstance
      .get('history-operation', { params: { operationId } })
      .then(handleResponse)
      .catch(handleApiError),
}
