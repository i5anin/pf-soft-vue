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
import Folder from './Folder.vue'
import { useEditorToolStore } from '../piniaStore'
import CatalogBreadcrumbs from './CatalogBreadcrumbs.vue'

export default {
  name: 'EditorCatalog',
  components: { CatalogBreadcrumbs, Folder },
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
      // Обработка ошибки, например, отображение сообщения пользователю
    }
  },
}
</script>
