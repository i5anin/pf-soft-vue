<template>
  <v-container>
    <tool-filter
      :filter-params-list="filterParamsList"
      :filters="filters"
      @filter-update="onParamsFilterUpdate"
    />
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
      :items="formattedTools"
      :items-length="toolsTotalCount"
      :items-per-page="filters.itemsPerPage"
      :page="filters.currentPage"
      :loading="isLoading"
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
        <td class="index">{{ index + 1 }}</td>
      </template>
      <!--name-->
      <template #item.name="{ item }">
        <td :class="colorClassGrey(item)" style="white-space: nowrap">
          {{ item.name }}
          <v-chip
            v-if="item.group_id"
            size="x-small"
            :color="getColorForGroup(item.group_id)"
            :title="'Группа ' + item.group_id"
          >
            <span v-if="item.group_standard" style="color: yellow">★</span>
            G{{ item.group_id }}</v-chip
          >
        </td>
      </template>
      <template #item.sklad="{ item }">
        <td :class="colorClassRed(item)" style="white-space: nowrap">
          {{ item.sklad }}
        </td>
      </template>
      <template #item.norma="{ item }">
        <td style="white-space: nowrap">{{ item.norma }}</td>
      </template>
      <template #item.zakaz="{ item }">
        <td style="white-space: nowrap">{{ calculateOrder(item) }}</td>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script>
import EditorToolModal from './Modal.vue'
import ToolFilter from './ToolFilter.vue'
import { mapActions, mapMutations, mapGetters } from 'vuex'

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
      openDialog: false,
      isDataLoaded: false,
      editingToolId: null, //редактирование идентификатора инструмента
      toolTableHeaders: [], //заголовки таблиц инструментов
      filterParamsList: [],
    }
  },
  computed: {
    ...mapGetters('EditorToolStore', [
      'toolsTotalCount',
      'formattedTools',
      'dynamicFilters',
      'filters',
      'parentCatalog',
      'isLoading',
    ]),
  },

  watch: {
    'parentCatalog.id'(newId) {
      if (newId != null) {
        this.fetchToolsDynamicFilters()
      }
    },
    dynamicFilters: {
      immediate: true,
      handler(dynamicColumns) {
        this.toolTableHeaders = [
          { title: '№', key: 'index', sortable: false },
          { title: 'Маркировка', key: 'name', sortable: false },
          ...(dynamicColumns && dynamicColumns.length > 0
            ? dynamicColumns.map(({ label: title, key }) => ({
                title,
                key,
                sortable: false,
              }))
            : []),
          { title: 'Норма', key: 'norma', sortable: false },
          { title: 'Склад', key: 'sklad', sortable: false },
          { title: 'Заказ', key: 'zakaz', sortable: false },
          // { title: 'Лимит', key: 'limit', sortable: false },
        ]
      },
    },
  },

  async mounted() {
    await this.fetchToolsDynamicFilters()
    this.isDataLoaded = true
  },
  methods: {
    ...mapActions('EditorToolStore', [
      'fetchToolsDynamicFilters',
      'fetchToolsByFilter',
    ]),
    ...mapMutations('EditorToolStore', [
      'setCurrentPage',
      'setItemsPerPage',
      'setSelectedDynamicFilters',
    ]),

    getColorForGroup(index) {
      const hue = index * 137.508 // используем золотое сечение
      return `hsl(${hue % 360}, 50%, 50%)`
    },
    // Метод для обработки обновления параметров фильтра
    onParamsFilterUpdate({ key, value }) {
      this.setSelectedDynamicFilters({
        ...this.filters.selectedDynamicFilters,
        [key]: value,
      })
      this.fetchToolsByFilter()
    },
    async onChangePage(page) {
      this.setCurrentPage(page)
      await this.fetchToolsByFilter()
    },
    async onUpdateItemsPerPage(itemsPerPage) {
      this.setItemsPerPage(itemsPerPage)
      await this.fetchToolsByFilter()
    },

    colorClassGrey(item) {
      return { grey: !item.sklad || item.sklad === 0 }
    },
    colorClassRed(item) {
      return { red: !item.sklad || item.sklad === 0 }
    },
    calculateOrder(tool) {
      const order = tool.norma - tool.sklad
      return order < 0 ? '' : order
    },

    onClosePopup() {
      this.openDialog = false
    },
    onSaveChanges() {
      this.openDialog = false
      this.fetchToolsDynamicFilters()
      this.fetchToolsByFilter()
    },
    onAddTool() {
      this.editingToolId = null
      this.openDialog = true
    },
    onEditRow(_, { item: tool }) {
      this.editingToolId = tool.id
      this.openDialog = true
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

.grey {
  color: grey;
}

.red {
  color: red;
}

.scrollable-table {
  height: 74vh; /* Замените это значение на желаемую высоту */
  overflow-y: auto;
}
</style>
