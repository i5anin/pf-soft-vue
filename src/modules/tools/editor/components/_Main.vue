<template>
  <div class="container">
    new
    <Catalog @catalog-selected="handleCatalogSelected" />
    new
    <ToolFilter @filter-changed="handleFilterChanged" />
    new
    <Table :tools="tools" :isLoading="isLoading" />
  </div>
</template>

<script>
import { onMounted, ref, watch } from 'vue'
import { useToolStore } from '../pinia'
import Catalog from './Catalog.vue'
import ToolFilter from './Filter.vue'
import Table from './Table.vue'

export default {
  name: 'Main',
  components: {
    Catalog,
    ToolFilter,
    Table,
  },
  setup() {
    const toolStore = useToolStore()

    // Состояние компонента Main
    const tools = ref([])
    const isLoading = ref(false)

    // Метод для обработки выбора каталога
    const handleCatalogSelected = async (catalogId) => {
      // Обновляем parentCatalog в хранилище
      toolStore.parentCatalog = { id: catalogId, label: null }
      // Загружаем динамические фильтры для выбранного каталога
      await toolStore.fetchToolsDynamicFilters()
      // Загружаем инструменты с учетом выбранного каталога и фильтров
      await fetchTools()
    }

    // Метод для обработки изменения фильтров
    const handleFilterChanged = async (filters) => {
      // Применяем фильтры к запросу инструментов
      await fetchTools(filters)
    }

    // Метод для загрузки инструментов с учетом фильтров
    const fetchTools = async (filters = {}) => {
      isLoading.value = true
      try {
        await toolStore.fetchToolsByFilter({
          ...toolStore.filters,
          ...filters,
        })
        tools.value = toolStore.formattedTools
      } catch (error) {
        console.error('Ошибка при загрузке инструментов:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Наблюдатель за изменением состояния хранилища
    watch(
      () => toolStore.filters,
      async () => {
        await fetchTools()
      }
    )

    // Загрузка данных при монтировании компонента
    onMounted(async () => {
      await fetchTools()
    })

    return {
      tools,
      isLoading,
      handleCatalogSelected,
      handleFilterChanged,
    }
  },
}
</script>
