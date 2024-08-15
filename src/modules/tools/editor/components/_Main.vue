<template>
  <div class="container">
    <Catalog />

    <ToolFilter />

    <Table />
  </div>
</template>

<script>
import Catalog from './сatalog/Catalog.vue'
import ToolFilter from './filter/MainFilter.vue'
import Table from './Table.vue'

export default {
  name: 'Main',
  components: { Catalog, ToolFilter, Table },
}
</script>
