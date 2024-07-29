// src/stores/tool.js
import { defineStore } from 'pinia'
import { toolApi } from '@/api'

export const useToolStore = defineStore('tool', {
  state: () => ({
    isLoading: false,
    parentCatalog: { id: 1, label: null },
    dynamicFilters: [],
    nameOptions: [],
    tool: null,
    tools: [],
    toolsTotalCount: 0,
  }),
  getters: {
    formattedTools(state) {
      return state.tools.map((tool) => ({
        ...tool,
        ...Object.entries(tool.property).reduce(
          (acc, [key, { value }]) => ({
            ...acc,
            [key]: value,
          }),
          {}
        ),
      }))
    },
  },
  actions: {
    /**
     * Получает информацию об инструменте по его ID.
     * @param {number} id - ID инструмента.
     * @returns {Promise<void>}
     */
    async fetchToolById(id) {
      try {
        this.tool = await toolApi.getToolById(id)
      } catch (error) {
        console.error('Ошибка при загрузке инструмента:', error)
      }
    },

    /**
     * Получает динамические фильтры для инструментов на основе выбранного родительского каталога.
     * @returns {Promise<void>}
     */
    async fetchToolsDynamicFilters() {
      const { id = null } = this.parentCatalog
      if (id === null) {
        return
      }

      try {
        const dynamicFilters = await toolApi.filterParamsByParentId(id)
        this.dynamicFilters = dynamicFilters

        this.selectedDynamicFilters = {
          ...this.selectedDynamicFilters,
          ...dynamicFilters.reduce(
            (acc, { key }) => ({ ...acc, [key]: null }),
            {}
          ),
        }
      } catch (e) {
        console.error('Ошибка при загрузке динамических фильтров:', e)
      }
    },

    /**
     * Получает список инструментов с учетом фильтров.
     * @param {Object} params - Параметры фильтрации.
     * @param {number} params.currentPage - Текущая страница.
     * @param {number} params.itemsPerPage - Количество элементов на странице.
     * @param {string} params.search - Строка поиска.
     * @param {boolean} params.includeNull - Включать ли элементы с пустыми значениями.
     * @param {boolean} [params.onlyInStock] - Показывать ли только товары в наличии.
     * @param {Object} params.selectedDynamicFilters - Выбранные значения динамических фильтров.
     * @param {number} params.parentId - ID родительского каталога.
     * @returns {Promise<void>}
     */
    async fetchToolsByFilter(params) {
      this.isLoading = true

      const {
        currentPage,
        itemsPerPage,
        search,
        includeNull,
        onlyInStock = null,
        selectedDynamicFilters,
        parentId = this.parentCatalog.id,
      } = params

      // Формируем параметры запроса
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        includeNull: includeNull.toString(),
        onlyInStock: onlyInStock?.toString(),
        search,
      })

      if (parentId !== null)
        queryParams.append('parent_id', parentId.toString())

      // Добавляем динамические фильтры
      Object.entries(selectedDynamicFilters).forEach(([key, value]) => {
        if (value !== null) {
          queryParams.append(`param_${key}`, value)
        }
      })

      try {
        const { tools, totalCount } = await toolApi.getTools(
          queryParams.toString()
        )
        this.tools = tools
        this.toolsTotalCount = totalCount
      } catch (error) {
        console.error('Ошибка при получении данных:', error)
      } finally {
        this.isLoading = false
      }
    },
  },
})
