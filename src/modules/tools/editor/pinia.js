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
    // ... ваши геттеры
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
    async fetchToolById(id) {
      try {
        this.tool = await toolApi.getToolById(id)
      } catch (error) {
        console.error('Ошибка при загрузке инструмента:', error)
      }
    },

    async fetchToolsDynamicFilters() {
      const { id = null } = this.parentCatalog
      if (id === null) {
        return
      }

      try {
        const dynamicFilters = await toolApi.filterParamsByParentId(id)
        this.dynamicFilters = dynamicFilters

        // Обновляем selectedDynamicFilters, устанавливая начальные значения для новых ключей
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
