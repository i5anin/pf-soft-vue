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
import Catalog from './catalog/_Catalog.vue'
import ToolFilter from './filter/_SearchFilters.vue'
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
