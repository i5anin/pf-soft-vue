// modules/tools/tree/store/tree.js
import { defineStore } from 'pinia'
import { toolTreeApi } from '@/modules/tools/tree/api/tree'

export const useTreeStore = defineStore('treeStore', {
  state: () => ({
    tree: [],
    currentItem: null,
    parentCatalog: { id: 1, label: null },
  }),
  actions: {
    async fetchTree() {
      try {
        const response = await toolTreeApi.getTree({ folderNotNull: true });
        console.log('API Response:', response);

        this.tree = response;
        this.currentItem = {...this.tree[0]};

        // Проверка, есть ли у currentItem свойство nodes
        if (this.currentItem.nodes) {
          console.log('tree:', this.tree);
          console.log('currentItem:', this.currentItem);
        } else {
          console.warn('currentItem не содержит свойство nodes. Проверьте API-ответ.');
        }
      } catch (error) {
        console.error('Ошибка при получении дерева инструментов:', error);
      }
    },

    addFolderToTree(id, label) {
      const newFolder = {
        id,
        label,
        elements: 0,
        available: 0,
        nodes: [],
        totalAvailable: 0,
        totalElements: 0,
      }
      this.currentItem.nodes.push(newFolder)
      this.currentItem = newFolder
      this.tree.push(newFolder)
    },

    renameFolderInTree(id, label) {
      const folder = this.findFolderById(id)
      if (folder) {
        folder.label = label
      }
    },

    goBackInTree() {
      if (this.tree.length > 1) {
        this.tree.pop()
        this.currentItem = this.tree[this.tree.length - 1]
        this.parentCatalog.id = this.currentItem.id
      }
    },

    findFolderById(id, nodes = this.tree) {
      for (const node of nodes) {
        if (node.id === id) {
          return node
        }
        if (node.nodes) {
          const found = this.findFolderById(id, node.nodes)
          if (found) {
            return found
          }
        }
      }
      return null
    },

    goToInTree(index) {
      this.currentItem = this.tree[index]
      this.tree = this.tree.slice(0, index + 1)
      this.parentCatalog.id = this.currentItem.id
    },

    selectItemInTree(item) {
      this.currentItem = item
      this.parentCatalog.id = item.id
      this.currentItem.id = item.id
      if (!this.tree.includes(item)) {
        this.tree.push(item)
      }
    },

    setParentCatalog(parentCatalog) {
      this.parentCatalog = { ...parentCatalog }
      this.currentItem.id = parentCatalog.id
    },
  },
  getters: {
    getTree: (state) => state.tree,
    getCurrentItem: (state) => state.currentItem,
    getParentCatalog: (state) => state.parentCatalog,
  },
})
