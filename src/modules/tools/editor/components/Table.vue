<template>
  <v-container>
    <div class="text-right">
      <v-btn color="blue" @click="onAddTool">
        <template #prepend>
          <v-icon>mdi-file-plus</v-icon>
        </template>
        Новый инструмент
      </v-btn>
    </div>
    <editor-tool-modal
      v-if="openDialog"
      :persistent="true"
      :tool-id="editingToolId"
      @canceled="onClosePopup"
      @changes-saved="onSaveChanges"
    />
    <v-data-table-server
      v-if="isDataLoaded"
      no-data-text="Нет данных"
      items-per-page-text="Пункты на странице:"
      loading-text="Загрузка данных"
      :headers="toolTableHeaders"
      :items="editorToolStore.getFormattedTools"
      :items-length="editorToolStore.getToolsTotalCount"
      :items-per-page="editorToolStore.getFilters.itemsPerPage"
      :page="editorToolStore.getFilters.currentPage"
      :loading="editorToolStore.getIsLoading"
      :items-per-page-options="[15, 50, 100, 300]"
      density="compact"
      class="elevation-1 scrollable-table"
      hover
      fixed-header
      width
      @update:page="onChangePage"
      @update:items-per-page="onUpdateItemsPerPage"
      @click:row="onEditRow"
    >
      <template #item.index="{ index }">
        <td class="index">
          {{
            index +
            1 +
            (editorToolStore.getFilters.currentPage - 1) *
              editorToolStore.getFilters.itemsPerPage
          }}
        </td>
      </template>
      <template #item.name="{ item }">
        <td style="white-space: nowrap">
          <span :class="colorClassGrey(item)">{{ item.name }}</span>
          <v-chip
            v-if="item.group_id"
            size="x-small"
            :color="getColorForGroup(item.group_id)"
            :title="'Группа ' + item.group_id"
          >
            <span v-if="item.group_standard" style="color: yellow">★</span>
            G{{ item.group_id }}
          </v-chip>
        </td>
      </template>
      <template #item.sklad="{ item }">
        <td style="white-space: nowrap">
          <v-chip :color="item.sklad === 0 ? 'red' : ''">
            {{ item.sklad }}
          </v-chip>
        </td>
      </template>
      <template #item.norma="{ item }">
        <td style="white-space: nowrap">
          {{ item.norma_green }} {{ item.norma }} {{ item.norma_red }}
        </td>
      </template>
      <template #item.zakaz="{ item }">
        <td style="white-space: nowrap">{{ calculateOrder(item) }}</td>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script>
import EditorToolModal from './modal/Modal.vue'
import ToolFilter from './filter/MainFilter.vue'
import { useEditorToolStore } from '../piniaStore'

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
  emits: [],
  data() {
    return {
      editorToolStore: useEditorToolStore(), // Инициализируем store
      openDialog: false,
      isDataLoaded: false,
      editingToolId: null,
      toolTableHeaders: [],
      filterParamsList: [],
      filters: {
        currentPage: 1,
        itemsPerPage: 15,
        search: '',
        includeNull: false,
        onlyInStock: null,
        selectedDynamicFilters: {},
      },
    }
  },

  watch: {
    'editorToolStore.parentCatalog.id'(newId) {
      if (newId != null) {
        this.fetchToolsDynamicFilters()
        this.fetchToolsByFilter()
      }
    },
    'editorToolStore.getDynamicFilters': {
      immediate: true,
      handler(dynamicColumns) {
        this.toolTableHeaders = [
          { title: '№', key: 'index', sortable: false },
          { title: 'Маркировка', key: 'name', sortable: false },
          { title: 'Склад', key: 'sklad', sortable: false },
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
    this.fetchToolsDynamicFilters() //динамический фильтр инструментов выборки
    this.fetchToolsByFilter() //получить инструменты по фильтру
    this.isDataLoaded = true
  },
  methods: {
    getColorForGroup(index) {
      const hue = index * 137.508
      return `hsl(${hue % 360}, 50%, 50%)`
    },
    //на странице изменений
    onChangePage(page) {
      this.editorToolStore.setCurrentPage(page)
      this.fetchToolsByFilter()
    },
    //при обновлении элементов на странице
    onUpdateItemsPerPage(itemsPerPage) {
      this.editorToolStore.setItemsPerPage(itemsPerPage)
      this.fetchToolsByFilter()
    },
    colorClassGrey(item) {
      return { grey: !item.sklad || item.sklad === 0 }
    },
    calculateOrder(tool) {
      const order = tool.norma - tool.sklad
      return order < 0 ? '' : order
    },
    //при закрытии всплывающего окна
    onClosePopup() {
      this.openDialog = false
    },
    //при сохранении изменений
    onSaveChanges() {
      this.openDialog = false
      this.fetchToolsDynamicFilters()
      this.fetchToolsByFilter()
    },
    //при добавлении инструмента
    onAddTool() {
      this.editingToolId = null
      this.openDialog = true
    },
    //в строке редактирования
    onEditRow(_, { item: tool }) {
      this.editingToolId = tool.id
      this.openDialog = true
    },
    //получить инструменты по фильтру
    fetchToolsByFilter() {
      this.editorToolStore.fetchToolsByFilter({ search: this.searchQuery })
    },
    //инструменты извлечения динамических фильтров
    fetchToolsDynamicFilters() {
      this.editorToolStore.fetchToolsDynamicFilters()
    },
  },
}
</script>

<style scoped>
.index {
  max-width: 40px !important;
  font-size: 0.9em;
  color: grey;
}
</style>
