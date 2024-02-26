import { toolApi } from '@/api'
import { editorToolApi } from '@/modules/editor-tool/api/editor'

export default {
  namespaced: true,
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
      selectedDynamicFilters: {},
    },
  }),
  mutations: {
    setParentCatalog(state, parentCatalog) {
      state.parentCatalog = { ...parentCatalog }
    },
    setDynamicFilters(state, dynamicFilters) {
      state.dynamicFilters = dynamicFilters
    },
    setSelectedDynamicFilters(state, selectedDynamicFilters) {
      state.filters.selectedDynamicFilters = selectedDynamicFilters
    },
    setIsLoading(state, isLoading) {
      state.isLoading = isLoading
    },
    setCurrentPage(state, page) {
      state.filters.currentPage = page
    },
    setFilters(state, filters) {
      state.filters = { ...filters }
    },
    setTool(state, tool) {
      state.tool = tool
    },
    setItemsPerPage(state, itemsPerPage) {
      state.filters.itemsPerPage = itemsPerPage
    },
    setToolsTotalCount(state, toolTotalCount) {
      state.toolsTotalCount = toolTotalCount
    },
    setTools(state, tools) {
      state.tools = tools
    },
  },
  actions: {
    async fetchToolById({ commit }, id) {
      try {
        const tool = await toolApi.getToolById(id)
        commit('setTool', tool)
      } catch (error) {
        console.error('Ошибка при загрузке инструмента:', error)
      }
    },

    async fetchToolsDynamicFilters({ commit, state }) {
      const { id = null } = state.parentCatalog
      if (id === null) {
        return
      }

      try {
        const dynamicFilters = await toolApi.filterParamsByParentId(id)
        commit(
          'setSelectedDynamicFilters',
          dynamicFilters.reduce((acc, { key }) => ({ ...acc, [key]: null }), {})
        )
        commit('setDynamicFilters', dynamicFilters)
      } catch (e) {
        console.error('Ошибка при загрузке динамических фильтров:', e)
      }
    },

    async fetchToolsByFilter({ commit, state }) {
      commit('setIsLoading', true)
      const {
        currentPage,
        itemsPerPage,
        search,
        includeNull,
        onlyInStock = null,
        selectedDynamicFilters,
      } = state.filters
      const { id: parentId } = state.parentCatalog

      // Формируем URL для запроса
      const params = new URLSearchParams({
        search: search,
        page: currentPage,
        limit: itemsPerPage,
        includeNull: includeNull,
        onlyInStock: onlyInStock,
      })
      if (parentId !== null) {
        params.append('parent_id', parentId)
      }

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
            {}
          )
        )
        commit('setTools', tools)
        commit('setToolsTotalCount', totalCount)
      } catch (error) {
        console.error('getTools. Ошибка при получении данных:', error)
      } finally {
        commit('setIsLoading', false)
      }
    },
  },
  getters: {
    parentCatalog: (state) => state.parentCatalog,
    dynamicFilters: (state) => state.dynamicFilters,

    filters: (state) => ({ ...state.filters }),
    tool: (state) => {
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
    tools: (state) => [...state.tools],
    formattedTools: (state) =>
      state.tools.map((tool) => ({
        ...tool,
        ...Object.entries(tool.property).reduce(
          (acc, [key, { value }]) => ({
            ...acc,
            [key]: value,
          }),
          {}
        ),
      })),
    isLoading: (state) => state.isLoading,

    // параметры фильтра
    nameOptions: (state) => state.nameOptions,
    toolsTotalCount: (state) => state.toolsTotalCount,
  },
}
