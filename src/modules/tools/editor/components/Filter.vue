<template>
  <div>
    <v-row v-if="dynamicFilters && dynamicFilters.length > 0">
      <v-col cols="12">
        <v-text-field
          v-model="searchQuery"
          variant="outlined"
          clearable
          append-icon="mdi-magnify"
          label="Поиск по инструменту"
          hide-details
          @input="onSearch"
          @update:model-value="onSearch"
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
      debouncedSearch: null,
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
  async mounted() {
    await this.fetchToolsDynamicFilters()
    this.debouncedSearch = this.debounce(this.onActualSearch, 500)
    this.isDataLoaded = true
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
    ]),
    onActualSearch() {
      store.commit('EditorToolStore/setSearch', this.searchQuery)
      store.dispatch('EditorToolStore/fetchToolsByFilter')
    },
    debounce(func, wait) {
      let timeout
      return function (...args) {
        const later = () => {
          timeout = null
          func.apply(this, args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    },
    onSearch() {
      this.debouncedSearch()
    },
    onParamsFilterUpdate({ key, value }) {
      this.setSelectedDynamicFilters({
        ...this.filters.selectedDynamicFilters,
        [key]: value,
      })
      this.fetchToolsByFilter()
    },
  },
}
</script>
