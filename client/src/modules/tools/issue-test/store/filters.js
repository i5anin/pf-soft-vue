// modules/tools/store/filters.js
import { defineStore } from 'pinia'
import { toolApi } from '@/api'

export const useFiltersStore = defineStore('filtersStore', {
  state: () => ({
    dynamicFilters: [],
    filters: {
      currentPage: 1,
      itemsPerPage: 15,
      search: '',
      includeNull: false,
      onlyInStock: true,
      selectedDynamicFilters: {},
    },
  }),
  actions: {
    async fetchToolsDynamicFilters(parentId) {
      if (parentId === null) {
        return
      }

      try {
        const dynamicFilters = await toolApi.filterParamsByParentId(parentId)
        this.filters.selectedDynamicFilters = dynamicFilters.reduce(
          (acc, { key }) => ({ ...acc, [key]: null }),
          {},
        )
        this.dynamicFilters = dynamicFilters
      } catch (e) {
        console.error('Ошибка при загрузке динамических фильтров:', e)
      }
    },

    setSearch(search) {
      this.filters.search = search
    },

    setCurrentPage(page) {
      this.filters.currentPage = page
    },

    setItemsPerPage(itemsPerPage) {
      this.filters.itemsPerPage = itemsPerPage
    },

    setDynamicFilters(dynamicFilters) {
      this.dynamicFilters = dynamicFilters
    },

    setSelectedDynamicFilters(selectedDynamicFilters) {
      this.filters.selectedDynamicFilters = selectedDynamicFilters
    },

    setFilters(filters) {
      this.filters = { ...filters }
    },
  },
  getters: {
    getFilters: (state) => ({ ...state.filters }),
    getDynamicFilters: (state) => state.dynamicFilters,
  },
})
