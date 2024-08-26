// modules/tools/store/tools.js
import { defineStore } from 'pinia'
import { toolApi } from '@/api'

export const useToolStore = defineStore('toolStore', {
  state: () => ({
    isLoading: false,
    tools: [],
    toolsTotalCount: 0,
    tool: null,
  }),
  actions: {
    async fetchToolsByFilter({
                               currentPage,
                               itemsPerPage,
                               search,
                               includeNull,
                               onlyInStock,
                               selectedDynamicFilters,
                               parentId,
                             }) {
      this.isLoading = true
      this.tools = []
      try {
        const { tools, totalCount } = await toolApi.getTools(
          search,
          currentPage,
          itemsPerPage,
          includeNull,
          parentId,
          onlyInStock,
          Object.entries(selectedDynamicFilters).reduce(
            (acc, [key, value]) => ({ ...acc, [`param_${key}`]: value }),
            {},
          ),
        )

        this.tools = tools
        this.toolsTotalCount = totalCount
      } catch (error) {
        console.error('getTools. Ошибка при получении данных:', error)
      } finally {
        this.isLoading = false
      }
    },

    async fetchToolById(id) {
      try {
        this.tool = await toolApi.getToolById(id)
      } catch (error) {
        console.error('Ошибка при загрузке инструмента:', error)
      }
    },

    setIsLoading(isLoading) {
      this.isLoading = isLoading
    },

    setTools(tools) {
      this.tools = tools
    },

    setToolsTotalCount(toolTotalCount) {
      this.toolsTotalCount = toolTotalCount
    },

    setTool(tool) {
      this.tool = tool
    },
  },
  getters: {
    getTools: (state) => [...state.tools],
    getToolsTotalCount: (state) => state.toolsTotalCount,
    getTool: (state) => state.tool,
    getIsLoading: (state) => state.isLoading,
  },
})
