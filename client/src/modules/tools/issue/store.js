import { toolApi } from '@/api'

export default {
  namespaced: true,
  state: () => ({
    selectedFio: null,
    selectedOperationId: null,

    isModalOpen: false,
    cartItems: [],

    isLoading: false,
    parentCatalog: { id: 1, label: null },

    dynamicFilters: [],
    nameOptions: [],

    tool: null,
    tools: [],
    toolsTotalCount: 0,
    cart: [], // Каждая позиция в корзине может быть представлена как { toolId: Number, quantity: Number }

    filters: {
      currentPage: 1,
      itemsPerPage: 15,
      search: '',
      includeNull: false,
      selectedDynamicFilters: {},
    },
  }),
  mutations: {
    // Мутация для очистки корзины
    CLEAR_CART(state) {
      state.cart = [] // Убедитесь, что используете правильный массив корзины
    },

    // Мутация для обновления каталога из сессии
    UPDATE_CATALOG_FROM_SESSION(state, newCatalog) {
      state.catalog = newCatalog // Обновление состояния каталога
    },
    setSelectedFio(state, fioId) {
      state.selectedFio = fioId
    },
    setSelectedOperationId(state, operationId) {
      state.selectedOperationId = operationId
    },
    setSelectedDetail(state, detail) {
      state.selectedDetail = detail
    },
    SET_MODAL_STATUS(state, status) {
      state.isModalOpen = status
    },

    // Добавляет инструмент в корзину или обновляет его количество, если он уже существует
    addToCart(state, { toolId, quantity, name, sklad }) {
      const existingItem = state.cart.find((item) => item.toolId === toolId)
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        state.cart.push({
          toolId,
          quantity,
          name,
          sklad, // Убедитесь, что это свойство добавлено
        })
      }
    },

    // Опционально: Удаляет позицию из корзины
    removeFromCart(state, toolId) {
      const index = state.cart.findIndex((item) => item.toolId === toolId)
      if (index !== -1) state.cart.splice(index, 1)
    },

    // Опционально: Обновляет количество позиции в корзине
    updateCartItemQuantity(state, { toolId, quantity }) {
      const item = state.cart.find((item) => item.toolId === toolId)
      if (item) {
        item.quantity = quantity
      }
    },

    setSearch(state, search) {
      state.filters.search = search
    },
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
    updateParentCatalog({ commit, dispatch }, parentCatalog) {
      commit('setParentCatalog', parentCatalog)
      dispatch('fetchToolsByFilter')
    },
    // Действие для очистки корзины
    clearCart({ commit }) {
      commit('CLEAR_CART')
    },
    // Действие для обновления каталога из сессии
    updateCatalogFromSession({ commit }, newCatalog) {
      commit('UPDATE_CATALOG_FROM_SESSION', newCatalog)
    },
    // Действие для добавления инструмента в корзину
    openModal({ commit }) {
      commit('SET_MODAL_STATUS', true)
    },
    closeModal({ commit }) {
      commit('SET_MODAL_STATUS', false)
    },
    addToCartAction({ commit }, { toolId, quantity, name, sklad }) {
      commit('addToCart', {
        toolId,
        quantity,
        name,
        sklad, // Передача данных о складе
      })
    },

    // Опционально: Действие для удаления инструмента из корзины
    removeFromCartAction({ commit }, toolId) {
      commit('removeFromCart', toolId)
    },

    // Опционально: Действие для обновления количества инструмента в корзине
    updateCartItemQuantityAction({ commit }, payload) {
      commit('updateCartItemQuantity', payload)
    },

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
      // Прежде всего сохраняем текущее состояние выбранных фильтров
      const selectedFilters = { ...state.filters.selectedDynamicFilters }
      commit('setIsLoading', true)
      const {
        currentPage,
        itemsPerPage,
        search, // Используем search из filters
        includeNull,
        onlyInStock = true,
        selectedDynamicFilters,
      } = state.filters
      const { id: parentId } = state.parentCatalog

      // Формируем URL для запроса
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        includeNull: includeNull,
        onlyInStock: onlyInStock,
        search: search, // Используем search непосредственно для запроса
      })
      if (parentId !== null) params.append('parent_id', parentId)

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
        // Восстанавливаем выбранные фильтры в состояние после загрузки данных
        commit('setSelectedDynamicFilters', selectedFilters)
      } catch (error) {
        console.error('getTools. Ошибка при получении данных:', error)
      } finally {
        commit('setIsLoading', false)
      }
    },
  },
  getters: {
    selectedFio: (state) => state.selectedFio,
    selectedOperationId: (state) => state.selectedOperationId,

    cartItems: (state) => state.cart,
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
