// Импорт общего экземпляра Axios и обработчиков ошибок
import { axiosInstance, axiosInstanceLaravel } from '@/api/axiosConfig'
import { handleApiError, handleResponse } from '@/api/errorHandler'

export const toolApi = {
  /**
   * Получение инструментов с возможностью фильтрации и пагинации.
   * @param search Поиск по ключевым словам.
   * @param page Номер страницы для пагинации.
   * @param limit Количество элементов на странице.
   * @param includeNull  Включать ли в результаты элементы с нулевыми значениями.
   * @param parentId Идентификатор родительской категории.
   * @param onlyInStock Показывать только те элементы, которые есть в наличии.
   * @param filters Объект с дополнительными фильтрами.
   */
  getTools: async (
    search = '',
    page = 1,
    limit = 10,
    includeNull = false,
    parentId = null,
    onlyInStock = true,
    filters = {}
  ) => {
    // Соединение статических и динамических параметров
    const params = {
      search,
      page,
      limit,
      includeNull,
      onlyInStock,
      parent_id: parentId,
      ...filters,
    }

    return axiosInstanceLaravel
      .get('/tools', { params })
      .then(handleResponse)
      .catch(handleApiError)
  },

  // Получить инструмент по ID инструмента
  getToolById: async (id) => {
    return axiosInstance
      .get(`/tool/${id}`)
      .then(handleResponse)
      .catch(handleApiError)
  },

  // Получить фильтры по ID папки
  filterParamsByParentId: async (parent_id) =>
    axiosInstance
      .get(`/filter-params/${parent_id}`)
      .then(handleResponse)
      .catch(handleApiError),
}
