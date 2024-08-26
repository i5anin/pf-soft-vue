// modules/tools/store/index.js
import { useToolStore } from './tools'
import { useTreeStore } from './tree'
import { useFiltersStore } from './filters'
import { useMovementStore } from './movement'

export function useEditorToolStore() {
  const toolStore = useToolStore()
  const treeStore = useTreeStore()
  const filtersStore = useFiltersStore()
  const movementStore = useMovementStore()

  const fetchToolsData = async () => {
    try {
      await filtersStore.fetchToolsDynamicFilters(treeStore.parentCatalog.id)
      await toolStore.fetchToolsByFilter({
        currentPage: filtersStore.filters.currentPage,
        itemsPerPage: filtersStore.filters.itemsPerPage,
        search: filtersStore.filters.search,
        includeNull: filtersStore.filters.includeNull,
        onlyInStock: filtersStore.filters.onlyInStock,
        selectedDynamicFilters: filtersStore.filters.selectedDynamicFilters,
        parentId: treeStore.parentCatalog.id,
      })
    } catch (error) {
      console.error('Ошибка при получении данных инструментов:', error)
    }
  }

  // ... другие методы, которые вызывают действия из дочерних сторов

  return {
    ...toolStore,
    ...treeStore,
    ...filtersStore,
    ...movementStore,
    fetchToolsData,
    // ... другие методы
  }
}
