<template>
  <div class="container">
    <Catalog />

    <ToolFilter />

    <Table />
  </div>
</template>

<script>
import Catalog from './Catalog.vue'
import ToolFilter from './Filter.vue'
import Table from './Table.vue'

export default {
  name: 'Main',
  components: {
    Catalog,
    ToolFilter,
    Table,
  },
}
</script>
