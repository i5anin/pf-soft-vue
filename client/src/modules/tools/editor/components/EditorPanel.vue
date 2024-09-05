<template>
  <div class='container'>
    <Catalog />
    <!--    <span v-if="currentItem?.elements">-->
    <ToolFilter />
    <Table />
    <!--    </span>-->
  </div>
</template>

<script>
import Catalog from './catalog/Catalog.vue'
import ToolFilter from './filter/SearchFilters.vue'
import Table from './Table.vue'
import { useEditorToolStore } from '../piniaStore'

export default {
  name: 'EditorPanel',
  components: { Catalog, ToolFilter, Table },
  computed: {
    currentItem() {
      const editorToolStore = useEditorToolStore()
      return !!editorToolStore.currentItem?.elements
    },
  },
}
</script>
