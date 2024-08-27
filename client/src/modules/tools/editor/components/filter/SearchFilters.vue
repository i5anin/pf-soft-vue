<template>
  <div class='pt-4'>
<!--    {{hasDynamicFilters}}-->
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
      @filter-update='onParamsFilterUpdate'
    />
  </div>
</template>

<script>
import { debounce } from 'lodash'
import { useEditorToolStore } from '../../piniaStore'
import DynamicFilters from './DynamicFilters.vue'

export default {
  components: {
    DynamicFilters,
  },
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

    onParamsFilterUpdate(updatedFilters) {
      this.editorToolStore.setSelectedDynamicFilters({
        ...this.getFilters.selectedDynamicFilters,
        ...updatedFilters,
      })
      this.fetchToolsByFilter()
    },

    fetchToolsByFilter() {
      this.editorToolStore.fetchToolsByFilter()
    },

    async fetchToolsDynamicFilters() {
      await this.editorToolStore.fetchToolsDynamicFilters()
    },
  },
  async mounted() {
    await this.fetchToolsDynamicFilters()
  },
}
</script>
