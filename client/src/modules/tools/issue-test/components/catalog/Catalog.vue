<template>
  <v-app class="custom-container">
    <folder />
    <v-main>
      <v-container :fluid="true">
        <v-row>
          <v-col cols="12">
            <Breadcrumbs />
            <v-progress-linear v-if="editorToolStore.isLoading" indeterminate />
            <div v-if="currentItems && !editorToolStore.isLoading" v-for="item in currentItems" :key="item.id">
              <CatalogItem :item="item" />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Folder from './EditFolder.vue'
import Breadcrumbs from './Breadcrumbs.vue'
import CatalogItem from './CatalogItem.vue'
import { useEditorToolStore } from '../../store'

export default {
  name: 'Catalog',
  components: { Folder, Breadcrumbs, CatalogItem },
  data() {
    return {
      editorToolStore: useEditorToolStore(),
    }
  },
  async created() {
    try {
      await this.editorToolStore.fetchTree()
    } catch (error) {
      console.error('Ошибка при получении дерева инструментов:', error)
    }
  },
  computed: {
    currentItems() {
      return this.editorToolStore.currentItem?.nodes || []
    },
  },
}
</script>
