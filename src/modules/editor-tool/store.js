import { toolApi } from '@/api'

export default {
  namespaced: true,
  state: () => ({
    idParent: { id: 1, label: null },
    isLoading: false,
    paramsList: [],
    nameOptions: [],

    tool: null,
    tools: [],
    toolsTotalCount: 0,
    filters: {
      currentPage: 1,
      itemsPerPage: 15,
      search: '',
      types: [],
      groups: [],
      materials: [],
      selectedParams: [],
      includeNull: false,
    },
  }),
  mutations: {
    updateIdParent(state, idParentData) {
      state.idParent = { ...idParentData }
      console.log('Новый parentId:', state.idParent)
    },
    setParamsList(state, params) {
      console.log('Обновленный список параметров:', params)
      state.paramsList = params
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

    async fetchToolsByFilter({ commit, state }) {
      commit('setIsLoading', true)
      const {
        currentPage,
        itemsPerPage,
        search,
        includeNull,
        onlyInStock = true,
      } = state.filters
      const { id: parentId } = state.idParent

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
        const { tools, totalCount, paramsList } = await toolApi.getTools(
          search,
          currentPage,
          itemsPerPage,
          includeNull,
          parentId,
          onlyInStock
        )
        commit('setParamsList', paramsList)
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
    idParent: (state) => state.idParent,
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
    paramsOptions: (state) => state.paramsOptions,
    paramsList: (state) => state.paramsList,
    nameOptions: (state) => state.nameOptions,
    toolsTotalCount: (state) => state.toolsTotalCount,
  },
}
