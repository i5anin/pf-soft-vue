<template>
  <div>
    <v-row v-if="hasDynamicFilters">
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

    <DynamicFilters
      v-if="hasDynamicFilters"
      :filters="groupedFilters"
      @filter-update="onParamsFilterUpdate"
    />
  </div>
</template>

<script>
import { debounce } from 'lodash'
import { mapActions, mapMutations, mapGetters } from 'vuex'
import store from '@/store/store'
import DynamicFilters from './DynamicFilters.vue'

export default {
  components: {
    DynamicFilters,
  },
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
      const filtersPerRow = 4
      const result = []

      for (let i = 0; i < this.dynamicFilters.length; i += filtersPerRow) {
        result.push(this.dynamicFilters.slice(i, i + filtersPerRow))
      }
      return result
    },
    hasDynamicFilters() {
      return this.dynamicFilters.length > 0
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
      'setSearch',
    ]),
    // Декорированный метод поиска с задержкой.
    debounceSearch: debounce(function () {
      // Используем импортированную debounce
      this.setSearch(this.searchQuery)
      this.fetchToolsByFilter()
    }, 500),
    onParamsFilterUpdate(updatedFilters) {
      this.setSelectedDynamicFilters({
        ...this.filters.selectedDynamicFilters,
        ...updatedFilters,
      })
      this.fetchToolsByFilter()
    },
  },
  async mounted() {
    await this.fetchToolsDynamicFilters()
  },
}
</script>
