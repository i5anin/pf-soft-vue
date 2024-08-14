<template>
  <v-app class="custom-container">
    <folder
      v-if="currentItem"
      :current-item="currentItem"
      @update:current-item="updateCurrentItem"
      :tree="tree"
    />
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
      editorToolStore: useEditorToolStore(),
      tree: [],
      currentItem: null,
    }
  },

  computed: {
    isTableShown() {
      return this.editorToolStore.getParentCatalog.id !== 1
    },
  },

  watch: {
    currentItem: {
      handler(currentItem) {
        this.editorToolStore.setParentCatalog({
          id: currentItem?.id,
          label: currentItem?.label,
        })
      },
    },
  },

  async created() {
    try {
      const toolsTree = await toolTreeApi.getTree()
      if (toolsTree && toolsTree.length > 0) {
        this.currentItem = toolsTree[0]
        this.tree.push(this.currentItem)
      }
    } catch (error) {
      console.error('Ошибка при получении дерева инструментов:', error)
      // Обработка ошибки, например, отображение сообщения пользователю
    }
  },

  methods: {
    findItemById(itemId, tree) {
      for (const item of tree) {
        if (item.id === itemId) {
          return [item] // Возвращаем найденный элемент в массиве - это будет путь
        }
        if (item.nodes) {
          const path = this.findItemById(itemId, item.nodes)
          if (path.length) {
            return [item, ...path] // Добавляем текущий элемент в начало пути
          }
        }
      }
      return [] // Путь не найден
    },

    async refreshTree() {
      const updatedTree = await toolTreeApi.getTree()
      this.tree = updatedTree
      const updatedCurrentItem = updatedTree.find(
        (item) => item.id === this.currentItem.id // Проверяем, если текущий элемент присутствует в обновленном дереве
      )
      this.currentItem = updatedCurrentItem // Если текущий элемент не найден, обновляем его на первый элемент из дерева или на null, если дерево пустое
        ? updatedCurrentItem
        : updatedTree.length > 0
          ? updatedTree[0]
          : null
    },

    updateCurrentItem(newItem) {
      this.currentItem = newItem
    },

    selectItem(item) {
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
