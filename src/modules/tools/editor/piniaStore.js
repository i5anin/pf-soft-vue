import { defineStore } from 'pinia'
import { toolApi } from '@/api'
import { toolTreeApi } from '@/modules/tools/tree/api/tree'

export const useEditorToolStore = defineStore('editorToolStore', {
  state: () => ({
    isLoading: false,
    parentCatalog: { id: 1, label: null },
    dynamicFilters: [],
    nameOptions: [],
    tool: null,
    tools: [],
    toolsTotalCount: 0,
    filters: {
      currentPage: 1,
      itemsPerPage: 15,
      search: '',
      includeNull: false,
      onlyInStock: null,
      selectedDynamicFilters: {},
    },
    tree: [],
    currentItem: null,
    path: [],
  }),

  actions: {
    async fetchTree() {
      this.isLoading = true
      try {
        const toolsTree = await toolTreeApi.getTree()
        if (toolsTree?.length) {
          this.tree = toolsTree
          this.setCurrentItem(toolsTree[0])
        }
      } catch (error) {
        console.error('Ошибка при получении дерева инструментов:', error)
      } finally {
        this.isLoading = false
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
      this.setCurrentItem(newFolder)
      this.tree.push(newFolder)
    },

    async renameFolderInTree(id, label) {
      const folder = this.findFolderById(id)
      if (folder) {
        folder.label = label
      }
    },

    goBackInTree() {
      if (this.path.length > 1) {
        const previousItemId = this.path[this.path.length - 2]
        const previousItem = this.findFolderById(previousItemId)
        this.setCurrentItem(previousItem)
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

    async fetchToolById(id) {
      try {
        this.tool = await toolApi.getToolById(id)
      } catch (error) {
        console.error('Ошибка при загрузке инструмента:', error)
      }
    },

    async fetchToolsDynamicFilters() {
      const { id: parentId = null } = this.parentCatalog
      if (!parentId) {
        return
      }

      try {
        const dynamicFilters = await toolApi.filterParamsByParentId(parentId)
        this.filters.selectedDynamicFilters = dynamicFilters.reduce(
          (acc, { key }) => ({ ...acc, [key]: null }),
          {}
        )
        this.dynamicFilters = dynamicFilters
      } catch (e) {
        console.error('Ошибка при загрузке динамических фильтров:', e)
      }
    },

    async fetchToolsByFilter() {
      this.isLoading = true
      this.tools = []
      try {
        const {
          currentPage,
          itemsPerPage,
          search,
          includeNull,
          onlyInStock,
          selectedDynamicFilters,
        } = this.filters
        const { id: parentId } = this.parentCatalog

        const { tools, totalCount } = await toolApi.getTools(
          search,
          currentPage,
          itemsPerPage,
          includeNull,
          parentId,
          onlyInStock,
          Object.entries(selectedDynamicFilters).reduce(
            (acc, [key, value]) => ({ ...acc, [`param_${key}`]: value }),
            {}
          )
        )

        this.tools = tools
        this.toolsTotalCount = totalCount
      } catch (error) {
        console.error('getTools. Ошибка при получении данных:', error)
      } finally {
        this.isLoading = false
      }
    },

    setSearch(search) {
      this.filters.search = search
    },

    setParentCatalog(parentCatalog) {
      this.parentCatalog = { ...parentCatalog }
    },

    setDynamicFilters(dynamicFilters) {
      this.dynamicFilters = dynamicFilters
    },

    setSelectedDynamicFilters(selectedDynamicFilters) {
      this.filters.selectedDynamicFilters = selectedDynamicFilters
    },

    setIsLoading(isLoading) {
      this.isLoading = isLoading
    },

    setCurrentPage(page) {
      this.filters.currentPage = page
    },

    setFilters(filters) {
      this.filters = { ...filters }
    },

    setTool(tool) {
      this.tool = tool
    },

    setItemsPerPage(itemsPerPage) {
      this.filters.itemsPerPage = itemsPerPage
    },

    setToolsTotalCount(toolTotalCount) {
      this.toolsTotalCount = toolTotalCount
    },

    setTools(tools) {
      this.tools = tools
    },
    goToInTree(index) {
      const targetItem = this.tree[index]
      if (targetItem) {
        this.setCurrentItem(targetItem)
      }
    },
    selectItemInTree(item) {
      this.setCurrentItem(item)
      if (!this.tree.includes(item)) {
        this.tree.push(item)
      }
    },
    setCurrentItem(newItem) {
      this.currentItem = newItem
      this.path = this.buildPath(newItem.id)
    },

    buildPath(itemId) {
      const findPath = (tree, itemId, currentPath = []) => {
        for (const item of tree) {
          if (item.id === itemId) {
            return [...currentPath, item.id]
          }
          if (item.nodes) {
            const foundPath = findPath(item.nodes, itemId, [
              ...currentPath,
              item.id,
            ])
            if (foundPath) {
              return foundPath
            }
          }
        }
        return null
      }

      return findPath(this.tree, itemId)
    },
  },
  getters: {
    getParentCatalog: (state) => state.parentCatalog,
    getDynamicFilters: (state) => state.dynamicFilters,
    getFilters: (state) => ({ ...state.filters }),
    getTool: (state) => {
      if (state.tool) {
        return {
          ...state.tool,
          property: state.tool.property,
          parent_id: state.tool.parent_id,
          folder_name: state.tool.folder_name,
        }
      }
      return null
    },
    getTools: (state) => [...state.tools],
    getFormattedTools: (state) =>
      state.tools.map((tool) => ({
        ...tool,
        ...Object.entries(tool.property).reduce(
          (acc, [key, { value }]) => ({ ...acc, [key]: value }),
          {}
        ),
      })),
    getIsLoading: (state) => state.isLoading,
    getNameOptions: (state) => state.nameOptions,
    getToolsTotalCount: (state) => state.toolsTotalCount,
    getCurrentItem: (state) => state.currentItem,
    getTree: (state) => state.tree,
  },
})
