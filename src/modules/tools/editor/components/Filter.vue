<template>
  <div>
    <v-row v-if="dynamicFilters.length">
      <v-col cols="12">
        <v-text-field
          v-model="searchQuery"
          variant="outlined"
          clearable
          append-icon="mdi-magnify"
          label="Поиск по инструменту"
          hide-details
          @input="debounceSearch"
        />
      </v-col>
    </v-row>

    <v-row
      v-for="(group, index) in groupedFilters"
      :key="`group-${index}`"
      cols="12"
      sm="6"
    >
      <v-col v-for="filter in group" :key="filter.key" cols="12" sm="3">
        <v-combobox
          density="compact"
          variant="solo"
          clearable
          :label="filter.label"
          :items="filter.values"
          :value="filters.selectedDynamicFilters[filter.key]"
          @update:model-value="
            (value) => onParamsFilterUpdate({ key: filter.key, value })
          "
        />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapGetters } from 'vuex'
import store from '@/store/store'

export default {
  data() {
    return {
      searchQuery: '',
    }
  },
  computed: {
    ...mapGetters('EditorToolStore', [
      'toolsTotalCount',
      'formattedTools',
      'dynamicFilters',
      'filters',
      'parentCatalog',
      'isLoading',
    ]),
    groupedFilters() {
      const result = []
      const itemsPerRow = 4

      for (let i = 0; i < this.dynamicFilters.length; i += itemsPerRow) {
        result.push(this.dynamicFilters.slice(i, i + itemsPerRow))
      }
      return result
    },
  },
  methods: {
    ...mapActions('EditorToolStore', [
      'fetchToolsDynamicFilters',
      'fetchToolsByFilter',
    ]),
    ...mapMutations('EditorToolStore', [
      'setSelectedDynamicFilters',
      'setCurrentPage',
      'setItemsPerPage',
      'setSearch', // Добавляем мутацию setSearch
    ]),
    // Декорированный метод поиска с задержкой.
    debounceSearch: _.debounce(function () {
      this.setSearch(this.searchQuery) // Обновляем состояние поиска в хранилище Vuex.
      this.fetchToolsByFilter() // Загружаем инструменты с учетом нового значения поиска.
    }, 500), // Задержка в 500 миллисекунд.

    onParamsFilterUpdate({ key, value }) {
      this.setSelectedDynamicFilters({
        ...this.filters.selectedDynamicFilters,
        [key]: value,
      })
      this.fetchToolsByFilter()
    },
  },
  async mounted() {
    await this.fetchToolsDynamicFilters()
  },
}
</script>
