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
      onlyInStock: null,
      selectedDynamicFilters: {},
    },
    movements: [],
    tree: [],
    currentItem: null,
    groupedFilters: [], // Добавляем groupedFilters в state
  }),
  actions: {
    async fetchTree() {
      try {
        this.tree = await toolTreeApi.getTree()
        this.currentItem = this.tree[0]
      } catch (error) {
        console.error('Ошибка при получении дерева инструментов:', error)
      }
    },

    async refreshTree() {
      await this.fetchTree()
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

    async goBackInTree() {
      if (this.tree.length > 1) {
        this.tree.pop()
        this.currentItem = this.tree[this.tree.length - 1]
        this.parentCatalog.id = this.currentItem.id

        // Сбрасываем фильтры и groupedFilters:
        this.setSelectedDynamicFilters({})
        this.clearGroupedFilters()

        // Обновляем dynamicFilters и groupedFilters:
        await this.fetchToolsDynamicFilters()

        await this.fetchToolsData()
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
        await this.fetchMovementHistory(id)
      } catch (error) {
        console.error('Ошибка при загрузке инструмента:', error)
      }
    },

    async fetchToolsDynamicFilters() {
      const { id = null } = this.parentCatalog
      if (id === null) {
        return
      }

      try {
        const dynamicFilters = await toolApi.filterParamsByParentId(id)
        this.filters.selectedDynamicFilters = dynamicFilters.reduce(
          (acc, { key }) => ({ ...acc, [key]: null }),
          {},
        )
        this.dynamicFilters = dynamicFilters

        // Группируем фильтры:
        this.groupedFilters = this.groupFilters(dynamicFilters)
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
          onlyInStock,
          selectedDynamicFilters,
        } = this.filters
        const { id: parentId } = this.parentCatalog

        const { tools, totalCount } = await toolApi.getTools(
          search,
          currentPage,
          itemsPerPage,
          parentId,
          onlyInStock,
          Object.entries(selectedDynamicFilters).reduce(
            (acc, [key, value]) => ({ ...acc, [`param_${key}`]: value }),
            {},
          ),
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
      this.currentItem.id = parentCatalog.id
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

    // Action для очистки groupedFilters:
    clearGroupedFilters() {
      this.groupedFilters = []
    },

    // Функция для группировки фильтров:
    groupFilters(filters) {
      const filtersPerRow = 4
      const result = []
      for (let i = 0; i < filters.length; i += filtersPerRow) {
        result.push(filters.slice(i, i + filtersPerRow))
      }
      return result
    },
    setTools(tools) {
      this.tools = tools
    },
    goToInTree(index) {
      this.currentItem = this.tree[index]
      this.tree = this.tree.slice(0, index + 1)
      this.parentCatalog.id = this.currentItem.id
      this.fetchToolsData()
    },
    selectItemInTree(item) {
      this.currentItem = item
      this.parentCatalog.id = item.id
      this.currentItem.id = item.id
      if (!this.tree.includes(item)) {
        this.tree.push(item)
      }
      this.fetchToolsData()
    },
    // Action для загрузки истории движения инструмента
    async fetchMovementHistory(toolId) {
      try {
        this.movements = (await editorToolApi.getToolMovementById(toolId)).map(
          (item) => ({
            ...item,
            change: (item.new_amount || 0) - (item.old_amount || 0),
          })
        )
      } catch (error) {
        console.error('Ошибка при загрузке истории движения:', error)
      }
    },

    async fetchToolsData() {
      try {
        // Загрузите динамические фильтры и дождитесь завершения
        await this.fetchToolsDynamicFilters();

        // После загрузки динамических фильтров, загрузите инструменты
        await this.fetchToolsByFilter();
      } catch (error) {
        console.error('Ошибка при получении данных инструментов:', error);
      }
    }

  },
  getters: {
    getMovementHistoryByToolId: (state) => (toolId) =>
      state.movements.filter((movement) => movement.tool_id === toolId),
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

    // Getter для groupedFilters:
    getGroupedFilters(state) {
      return state.groupedFilters
    },
  },
})
