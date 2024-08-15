<template>
  <div class="container">
    <Catalog />

    <!--    <div v-if="currentItem" class="catalog-info">-->
    <!--      {{ currentItem.available }} / {{ currentItem.elements }}-->
    <!--    </div>-->

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
