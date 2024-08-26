<template>
  <v-container>
    <div class='text-right'>
      <v-btn color='blue' @click='onAddTool'>
        <template #prepend>
          <v-icon>mdi-file-plus</v-icon>
        </template>
        Новый инструмент
      </v-btn>
    </div>
    <editor-tool-modal
      v-if='openDialog'
      :persistent='true'
      :tool-id='editingToolId'
      @canceled='onClosePopup'
      @changes-saved='handleSaveChanges'
    />
    <v-data-table-server
      v-if='isDataLoaded'
      no-data-text='Нет данных'
      items-per-page-text='Пункты на странице:'
      loading-text='Загрузка данных'
      :headers='toolTableHeaders'
      :items='formattedTools'
      :items-length='totalToolsCount'
      :items-per-page='itemsPerPage'
      :page='currentPage'
      :loading='isLoading'
      :items-per-page-options='[15, 50, 100, 300]'
      density='compact'
      class='elevation-1 scrollable-table'
      hover
      fixed-header
      width
      @update:page='handlePageChange'
      @update:items-per-page='handleItemsPerPageChange'
      @click:row='handleRowClick'
    >
      <template #item.index='{ index }'>
        <td class='index'>
          {{ calculateItemIndex(index) }}
        </td>
      </template>
      <template #item.name='{ item }'>
        <td style='white-space: nowrap'>
          <span :class='{ grey: !item.sklad || item.sklad === 0 }'>
            {{ item.name }}
          </span>
          <v-chip
            v-if='item.group_id'
            size='x-small'
            :color='getColorForGroup(item.group_id)'
            :title="'Группа ' + item.group_id"
          >
            <span v-if='item.group_standard' style='color: yellow'>★</span>
            G{{ item.group_id }}
          </v-chip>
        </td>
      </template>
      <template #item.sklad='{ item }'>
        <td style='white-space: nowrap'>
          <v-chip :color="item.sklad === 0 ? 'red' : appColor()">
            {{ item.sklad }}
          </v-chip>
          <span v-if='item.norma' class='grey'> / {{ item.norma }} </span>
        </td>
      </template>
      <template #item.norma='{ item }'>
        <td style='white-space: nowrap'>
          <span class='green' v-if='item.norma_green'>
            {{ item.norma_green }}
            <span class='grey'>|</span>
          </span>
          {{ item.norma }}
          <span class='red' v-if='item.norma_red'>
            <span class='grey'>|</span>
            {{ item.norma_red }}
          </span>
        </td>
      </template>
      <template #item.zakaz='{ item }'>
        <td style='white-space: nowrap'>{{ calculateToolOrder(item) }}</td>
      </template>
      <template #item.damaged='{ item }'>
        <td align='center'>
          <v-btn color='red' size='small' icon='mdi-image-broken-variant'
                 >
<!--            @click='(event) => onDamagedTool(event, item)'-->
          </v-btn>
        </td>
      </template>
      <template #item.cart='{ item }'>
        <td align='center'>
          <v-btn color='yellow' size='small' icon='mdi-cart-arrow-down'
                 >
<!--            @click='addToolToCart(item.id, 1)'-->
          </v-btn>
        </td>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script>
import EditorToolModal from './modal/ModalCart.vue'
import ToolFilter from './filter/Filter.vue'
import { useEditorToolStore } from '../piniaStore'
import { appColor, getColorForGroup } from '@/utils/colorUtils'

export default {
  components: {
    EditorToolModal,
    ToolFilter,
  },
  props: {
    namespace: {
      type: String,
      default: 'tool',
    },
  },
  data() {
    return {
      editorToolStore: useEditorToolStore(),
      openDialog: false,
      isDataLoaded: false,
      editingToolId: null,
      toolTableHeaders: [],
    }
  },
  computed: {
    formattedTools() {
      return this.editorToolStore.getFormattedTools
    },
    totalToolsCount() {
      return this.editorToolStore.getToolsTotalCount
    },
    itemsPerPage() {
      return this.editorToolStore.getFilters.itemsPerPage
    },
    currentPage() {
      return this.editorToolStore.getFilters.currentPage
    },
    isLoading() {
      return this.editorToolStore.getIsLoading
    },
    currentItem() {
      return this.editorToolStore.getCurrentItem
    },
    dynamicFilters() {
      return this.editorToolStore.getDynamicFilters
    },
  },
  watch: {
    'editorToolStore.parentCatalog.id': {
      handler(newParentId) {
        if (newParentId != null) {
          this.fetchToolsData()
        }
      },
    },
    dynamicFilters: {
      immediate: true,
      handler(dynamicColumns) {
        this.toolTableHeaders = [
          { title: '№', key: 'index', sortable: false },
          { title: 'Маркировка', key: 'name', sortable: false },
          { title: '⭐Склад / Норма', key: 'sklad', sortable: false },
          // { title: 'Норма', key: 'norma', sortable: false },
          { title: 'Выдать', key: 'cart', sortable: false },
          { title: 'Поврежден', key: 'damaged', sortable: false },
          { title: 'Норма', key: 'norma', sortable: false },
          ...(dynamicColumns && dynamicColumns.length > 0
            ? dynamicColumns.map(({ label: title, key }) => ({
              title,
              key,
              sortable: false,
            }))
            : []),
        ]
      },
    },
  },
  mounted() {
    this.fetchToolsData()
    this.isDataLoaded = true
  },
  methods: {
    appColor,
    getColorForGroup,
    handlePageChange(page) {
      this.editorToolStore.setCurrentPage(page)
      this.fetchToolsByFilter()
    },
    handleItemsPerPageChange(itemsPerPage) {
      this.editorToolStore.setItemsPerPage(itemsPerPage)
      this.fetchToolsByFilter()
    },
    calculateItemIndex(index) {
      return (
        index +
        1 +
        (this.editorToolStore.getFilters.currentPage - 1) *
        this.editorToolStore.getFilters.itemsPerPage
      )
    },
    calculateToolOrder(tool) {
      const order = tool.norma - tool.sklad
      return order < 0 ? '' : order
    },
    onClosePopup() {
      this.openDialog = false
    },
    handleSaveChanges() {
      this.openDialog = false
      this.fetchToolsData()
    },
    onAddTool() {
      this.editingToolId = null
      this.openDialog = true
    },
    handleRowClick(_, { item: tool }) {
      this.editingToolId = tool.id
      this.openDialog = true
    },
    fetchToolsByFilter() {
      this.editorToolStore.fetchToolsByFilter({ search: this.searchQuery })
    },
    fetchToolsData() {
      this.editorToolStore.fetchToolsDynamicFilters()
      this.fetchToolsByFilter()
    },
  },
}
</template>

<style scoped>
  .index {
  max - width: 40px !important;
  font-size: 0.9em;
  color: grey;
}

  .red {
  color: red;
}

  .green {
  color: green;
}
</style>
<script setup>
</script>
