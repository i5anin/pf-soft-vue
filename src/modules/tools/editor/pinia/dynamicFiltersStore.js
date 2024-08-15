// dynamicFiltersStore.js
import { defineStore } from 'pinia'
import { toolApi } from '@/api'

export const useDynamicFiltersStore = defineStore('dynamicFiltersStore', {
  state: () => ({
    dynamicFilters: [],
    selectedDynamicFilters: {},
  }),
  actions: {
    async fetchToolsDynamicFilters(parentId) {
      try {
        const dynamicFilters = await toolApi.filterParamsByParentId(parentId)
        this.dynamicFilters = dynamicFilters
        this.selectedDynamicFilters = dynamicFilters.reduce(
          (acc, { key }) => ({ ...acc, [key]: null }),
          {}
        )
      } catch (e) {
        console.error('Ошибка при загрузке динамических фильтров:', e)
      }
    },

    setSelectedDynamicFilters(selectedDynamicFilters) {
      this.selectedDynamicFilters = selectedDynamicFilters
    },
  },
  getters: {
    getDynamicFilters: (state) => state.dynamicFilters,
    getSelectedDynamicFilters: (state) => state.selectedDynamicFilters,
  },
})
