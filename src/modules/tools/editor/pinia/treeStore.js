// treeStore.js
import { defineStore } from 'pinia'
import { toolTreeApi } from '@/modules/tools/tree/api/tree'

export const useTreeStore = defineStore('treeStore', {
  state: () => ({
    tree: [],
    currentItem: null,
  }),
  actions: {
    async fetchTree() {
      try {
        const toolsTree = await toolTreeApi.getTree()
        if (toolsTree && toolsTree.length > 0) {
          this.tree = toolsTree
          this.currentItem = toolsTree[0]
        }
      } catch (error) {
        console.error('Ошибка при получении дерева инструментов:', error)
      }
    },

    async refreshTree() {
      await this.fetchTree()
    },

    async addFolderToTree(id, label) {
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

    async renameFolderInTree(id, label) {
      const folder = this.findFolderById(id)
      if (folder) {
        folder.label = label
      }
    },

    goBackInTree() {
      if (this.tree.length > 1) {
        this.tree.pop()
        this.currentItem = this.tree[this.tree.length - 1]
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
    },
    selectItemInTree(item) {
      this.currentItem = item
      if (!this.tree.includes(item)) {
        this.tree.push(item)
      }
    },
  },
  getters: {
    getCurrentItem: (state) => state.currentItem,
    getTree: (state) => state.tree,
  },
})
