<template>
  <div class='pt-4'>
    <v-row v-if='hasDynamicFilters'>
      <v-col cols='12'>
        <v-text-field
          v-model='searchQuery'
          variant='outlined'
          clearable
          prepend-inner-icon='mdi-magnify'
          label='Поиск по инструменту'
          hide-details
          @input='debounceSearch'
        />
      </v-col>
    </v-row>

    <DynamicFilters
      v-if='hasDynamicFilters'
      :filters='groupedFilters'
      @filter-update='updateFiltersAndFetch'
    />
  </div>
</template>

<script>
import { debounce } from 'lodash'
import { useEditorToolStore } from '../../piniaStore'
import DynamicFilters from './DynamicFilters.vue'

export default {
  components: { DynamicFilters },
  data() {
    return {
      searchQuery: '',
      editorToolStore: useEditorToolStore(),
    }
  },
  computed: {
    groupedFilters() {
      const filtersPerRow = 4
      const result = []
      const dynamicFilters = this.editorToolStore.getDynamicFilters // Доступ к getter

      for (let i = 0; i < dynamicFilters.length; i += filtersPerRow) {
        result.push(dynamicFilters.slice(i, i + filtersPerRow))
      }
      return result
    },
    hasDynamicFilters() {
      return this.editorToolStore.getDynamicFilters.length > 0 // Доступ к getter
    },
    getFilters() {
      return this.editorToolStore.getFilters
    },
  },
  methods: {
    debounceSearch: debounce(function() {
      this.editorToolStore.setSearch(this.searchQuery)
      this.fetchToolsByFilter()
    }, 500),

    updateFiltersAndFetch(updatedFilters) {
      console.log('[ToolSearch] Обновление фильтров...', updatedFilters)
      this.editorToolStore.setSelectedDynamicFilters({
        ...this.getFilters.selectedDynamicFilters,
        ...updatedFilters,
      })
      console.log("updateFiltersAndFetch")
      this.fetchToolsByFilter()
    },

    fetchToolsByFilter() {
      console.log('[store] Вызываем метод для получения инструментов')
      console.log("fetchToolsByFilter")
      this.editorToolStore.fetchToolsByFilter()
    },

    async fetchToolsDynamicFilters() {
      // console.log('[store] Получаем динамические фильтры для инструментов.')
      await this.editorToolStore.fetchToolsDynamicFilters()
    },
  },
  async mounted() {
    // console.log('ToolSearch: Загружаем динамические фильтры...')
    await this.fetchToolsDynamicFilters()
  },
}
</script>
