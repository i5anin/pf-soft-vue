import { addTool, getTools, getToolById } from '@/api'

export const store = {
  namespaced: true,
  state: {
    idParent: { id: 1, label: null },
    isLoading: false,
    paramsList: [],
    shagOptions: [],
    gabaritOptions: [],
    widthOptions: [],
    nameOptions: [],

    tool: null,
    tools: [],
    issueTools: [],
    issueFilter: {},
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
  },
  mutations: {
    updateIdParent(state, idParentData) {
      console.log('VueX. Изменяется idParent:', idParentData.id)
      state.idParent = { ...idParentData }
    },
    setParamsList(state, params) {
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
    setIssueFilters(state, filters) {
      state.issueFilter = { ...filters }
    },
    setIssueTools(state, issueTools) {
      state.issueTools = issueTools
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
        const tool = await getToolById(id)
        commit('setTool', tool)
      } catch (error) {
        console.error('Ошибка при загрузке инструмента:', error)
      }
    },
    async fetchIssueTools({ commit, state }) {
      commit('setIsLoading', true)
      const { currentPage, itemsPerPage, search, includeNull, selectedParams } =
        state.issueFilters
      const { id: parentId } = state.idParent
      try {
        const { tools, totalCount, paramsList } = await getTools(
          search,
          currentPage,
          itemsPerPage,
          includeNull,
          parentId,
          selectedParams
        )
        commit('setParamsList', paramsList) // Это данные, которые передаются в мутацию. Полученный из функции getTools
        commit('setTools', tools) // Инструменты
        commit('setToolsTotalCount', totalCount) // Счетчик
      } catch (error) {
        console.error('getTools. Ошибка при получении данных:', error)
      } finally {
        commit('setIsLoading', false)
      }
    },
    async fetchToolsByFilter({ commit, state }) {
      commit('setIsLoading', true)
      const { currentPage, itemsPerPage, search, includeNull, selectedParams } =
        state.filters
      const { id: parentId } = state.idParent
      try {
        const { tools, totalCount, paramsList } = await getTools(
          search,
          currentPage,
          itemsPerPage,
          includeNull,
          parentId,
          selectedParams
        )
        commit('setParamsList', paramsList) // Это данные, которые передаются в мутацию. Полученный из функции getTools
        commit('setTools', tools) // Инструменты
        commit('setToolsTotalCount', totalCount) // Счетчик
      } catch (error) {
        console.error('getTools. Ошибка при получении данных:', error)
      } finally {
        commit('setIsLoading', false)
      }
    },
    async onSaveToolModel({ dispatch }, toolModel) {
      try {
        // Отправка данных на сервер
        const result = await addTool({
          name: toolModel.name,
          property: Object.fromEntries(
            Object.entries(toolModel.property).filter(
              ([, value]) => value != null
            ) // {name: 'her',} -> ['name', 'her'] - преобразование данных
          ),
        })
        if (result) {
          dispatch('fetchToolsByFilter')
          // localStorage.setItem('lastSavedToolModel', JSON.stringify(toolModel))
        }
      } catch (error) {
        console.error('Ошибка при сохранении инструмента:', error)
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
