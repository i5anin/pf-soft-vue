<template>
  <div class="container">
    <!--    <span v-if="currentItem">-->
    <!--      {{ currentItem.id }} {{ currentItem.label }}-->
    <!--    </span>-->
    <Catalog />
    <span v-if="currentItem?.elements">
      <ToolFilter />
      <Table />
    </span>
  </div>
</template>

<script>
import Catalog from './сatalog/Catalog.vue'
import ToolFilter from './filter/MainFilter.vue'
import Table from './Table.vue'
import { useEditorToolStore } from '@/modules/tools/editor/piniaStore'

export default {
  name: 'Main',
  components: { Catalog, ToolFilter, Table },
  computed: {
    currentItem() {
      const editorToolStore = useEditorToolStore()
      return editorToolStore.getCurrentItem
    },
  },
}
</script>
