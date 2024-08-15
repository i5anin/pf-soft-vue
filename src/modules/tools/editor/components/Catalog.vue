<template>
  <v-app class="custom-container">
    <folder />
    <v-main>
      <v-container :fluid="true">
        <v-row>
          <v-col cols="12">
            <catalog-breadcrumbs />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useEditorToolStore } from '../piniaStore'
import CatalogBreadcrumbs from './CatalogBreadcrumbs.vue'
import Folder from './Folder.vue'

export default {
  components: { CatalogBreadcrumbs, Folder },
  data() {
    return {
      store: useEditorToolStore(),
    }
  },
  computed: {
    isLoading() {
      return this.store.isLoading
    },
  },
  watch: {
    'store.currentItem': {
      handler(newItem) {
        console.log('Текущий элемент в CatalogView:', newItem)
      },
    },
  },
  created() {
    this.store.fetchTree()
  },
}
</script>
