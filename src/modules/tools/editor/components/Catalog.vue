<template>
  <v-app class="custom-container">
    <folder />
    <v-main>
      <v-container :fluid="true">
        <v-row>
          <v-col cols="12">
            <catalog-breadcrumbs
              v-bind="{ tree, currentItem }"
              @go-to="goTo"
              @item-selected="selectItem"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { toolTreeApi } from '@/modules/tools/tree/api/tree'
import Folder from './Folder.vue'
import { useEditorToolStore } from '../piniaStore'
import TabMainTable from '@/modules/tools/editor/components/Table.vue'
import CatalogBreadcrumbs from '@/modules/tools/shared/components/CatalogBreadcrumbs.vue'

export default {
  name: 'EditorCatalog',
  components: { TabMainTable, CatalogBreadcrumbs, Folder },
  data() {
    return {
      editorToolStore: useEditorToolStore(), // Инициализируем store в data()
      tree: [],
      currentItem: null,
    }
  },

  watch: {
    currentItem: {
      handler(currentItem) {
        this.editorToolStore.setParentCatalog({
          id: currentItem?.id,
          label: currentItem?.label,
        })
        this.editorToolStore.fetchToolsByFilter()
      },
    },
  },
  async created() {
    const toolsTree = await toolTreeApi.getTree()
    if (toolsTree && toolsTree.length > 0) {
      this.currentItem = toolsTree[0]
      this.tree.push(this.currentItem)
    }
  },
  methods: {
    async renameCurrentItem() {
      const itemId = this.currentItem.id
      const newName = this.editableLabel

      try {
        const response = await toolTreeApi.renameFolder(itemId, newName)
        if (response && response.message) {
          alert('Папка успешно переименована.')
          this.currentItem.label = newName
          const historyItem = this.tree.find((item) => item.id === itemId)
          if (historyItem) {
            historyItem.label = newName
          }
        } else {
          alert('Произошла ошибка при переименовании.')
        }
      } catch (error) {
        console.error('Ошибка при переименовании:', error)
        alert('Произошла ошибка при переименовании.')
      }
    },

    async refreshTree() {
      const updatedTree = await toolTreeApi.getTree()
      this.tree = updatedTree
      const updatedCurrentItem = updatedTree.find(
        (item) => item.id === this.currentItem?.id
      )
      this.currentItem = updatedCurrentItem
        ? updatedCurrentItem
        : updatedTree.length > 0
          ? updatedTree[0]
          : null
    },

    async selectItem(item) {
      this.editorToolStore.setParentCatalog({ id: item.id, label: item.label })
      this.currentItem = item
      if (!this.tree.includes(item)) this.tree.push(item)
    },

    goTo(index) {
      this.currentItem = this.tree[index]
      this.editorToolStore.setParentCatalog({
        id: this.currentItem.id,
        label: this.currentItem.label,
      })
      this.tree = this.tree.slice(0, index + 1)
      this.currentItem = this.tree[index]
    },
  },
}
</script>
