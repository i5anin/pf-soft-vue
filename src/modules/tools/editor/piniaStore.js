import { defineStore } from 'pinia'
import { toolApi } from '@/api'

export const useEditorToolStore = defineStore('editorToolStore', {
  state: () => ({
    isLoading: false,
    parentCatalog: { id: 1, label: null },
    dynamicFilters: [],
    nameOptions: [],
    tool: null,
    tools: [],
    toolsTotalCount: 0,
    filters: {
      currentPage: 1,
      itemsPerPage: 15,
      search: '',
      includeNull: false,
      onlyInStock: null,
      selectedDynamicFilters: {},
    },
  }),
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
        this.filters.selectedDynamicFilters = dynamicFilters.reduce(
          (acc, { key }) => ({ ...acc, [key]: null }),
          {}
        )
        this.dynamicFilters = dynamicFilters
      } catch (e) {
        console.error('Ошибка при загрузке динамических фильтров:', e)
      }
    },

    async fetchToolsByFilter() {
      this.isLoading = true

      try {
        const {
          currentPage,
          itemsPerPage,
          search,
          includeNull,
          onlyInStock,
          selectedDynamicFilters,
        } = this.filters
        const { id: parentId } = this.parentCatalog

        const { tools, totalCount } = await toolApi.getTools({
          search,
          page: currentPage,
          limit: itemsPerPage,
          includeNull,
          parentId,
          onlyInStock,
          ...Object.entries(selectedDynamicFilters).reduce(
            (acc, [key, value]) => ({ ...acc, [`param_${key}`]: value }),
            {}
          ),
        })

        this.tools = tools
        this.toolsTotalCount = totalCount
      } catch (error) {
        console.error('getTools. Ошибка при получении данных:', error)
      } finally {
        this.isLoading = false
      }
    },

    setSearch(search) {
      this.filters.search = search
    },

    setParentCatalog(parentCatalog) {
      this.parentCatalog = { ...parentCatalog }
    },

    setDynamicFilters(dynamicFilters) {
      this.dynamicFilters = dynamicFilters
    },

    setSelectedDynamicFilters(selectedDynamicFilters) {
      this.filters.selectedDynamicFilters = selectedDynamicFilters
    },

    setIsLoading(isLoading) {
      this.isLoading = isLoading
    },

    setCurrentPage(page) {
      this.filters.currentPage = page
    },

    setFilters(filters) {
      this.filters = { ...filters }
    },

    setTool(tool) {
      this.tool = tool
    },

    setItemsPerPage(itemsPerPage) {
      this.filters.itemsPerPage = itemsPerPage
    },

    setToolsTotalCount(toolTotalCount) {
      this.toolsTotalCount = toolTotalCount
    },

    setTools(tools) {
      this.tools = tools
    },

    setOnlyInStock(onlyInStock) {
      this.filters.onlyInStock = onlyInStock
    },
  },
  getters: {
    getParentCatalog: (state) => state.parentCatalog,
    getDynamicFilters: (state) => state.dynamicFilters,
    getFilters: (state) => ({ ...state.filters }),
    getTool: (state) => {
      if (state.tool) {
        return {
          ...state.tool,
          property: state.tool.property,
          parent_id: state.tool.parent_id,
          folder_name: state.tool.folder_name,
        }
      }
      return null
    },
    getTools: (state) => [...state.tools],
    getFormattedTools: (state) =>
      state.tools.map((tool) => ({
        ...tool,
        ...Object.entries(tool.property).reduce(
          (acc, [key, { value }]) => ({ ...acc, [key]: value }),
          {}
        ),
      })),
    getIsLoading: (state) => state.isLoading,
    getNameOptions: (state) => state.nameOptions,
    getToolsTotalCount: (state) => state.toolsTotalCount,
  },
})
