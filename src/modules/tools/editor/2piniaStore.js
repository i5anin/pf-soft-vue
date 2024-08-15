import { createPinia } from 'pinia'
import { useToolsStore } from './pinia/toolsStore'
import { useTreeStore } from './pinia/treeStore'
import { useDynamicFiltersStore } from './pinia/dynamicFiltersStore'
import { useParentCatalogStore } from './pinia/parentCatalogStore'

const pinia = createPinia()
pinia.use(({ store }) => {
  store.registerStore('toolsStore', useToolsStore)
  store.registerStore('treeStore', useTreeStore)
  store.registerStore('dynamicFiltersStore', useDynamicFiltersStore)
  store.registerStore('parentCatalogStore', useParentCatalogStore)
})

export default pinia
