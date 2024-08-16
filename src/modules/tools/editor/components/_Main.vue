<template>
  <div class="container">
    <Catalog />
    <span v-if="currentItem?.elements">
      <ToolFilter />
      <Table />
    </span>
  </div>
</template>

<script>
import Catalog from './сatalog/_Catalog.vue'
import ToolFilter from './filter/_Filter.vue'
import Table from './Table.vue'
import { useEditorToolStore } from '@/modules/tools/editor/piniaStore'

export default {
  name: 'Main',
  components: { Catalog, ToolFilter, Table },
  computed: {
    currentItem() {
      console.log('currentItem')
      const editorToolStore = useEditorToolStore()
      return editorToolStore.getCurrentItem
    },
  },
}
</script>
