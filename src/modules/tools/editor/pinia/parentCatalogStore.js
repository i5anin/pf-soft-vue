// parentCatalogStore.js
import { defineStore } from 'pinia'

export const useParentCatalogStore = defineStore('parentCatalogStore', {
  state: () => ({
    parentCatalog: { id: 1, label: null },
  }),
  actions: {
    setParentCatalog(parentCatalog) {
      this.parentCatalog = { ...parentCatalog }
    },
  },
  getters: {
    getParentCatalog: (state) => state.parentCatalog,
  },
})
