<template>
  <v-container>
    <!-- <v-btn color="blue" @click="onAddTool">Добавить</v-btn>-->
    <edit-tool-modal
      v-if="openDialog"
      :persistent="true"
      :id_part="editingToolId"
      @canceled="onClosePopup"
      @changes-saved="onSaveChanges"
    />

    <v-data-table-server
      v-if="toolsHistory && toolsHistory.length > 0"
      no-data-text="Нет данных"
      items-per-page-text="Пункты на странице:"
      loading-text="Загрузка данных"
      :headers="headers"
      :items-length="totalCount"
      :items="toolsHistory"
      :items-per-page="filters.itemsPerPage"
      :page="filters.currentPage"
      :loading="isLoading"
      :items-per-page-options="[15, 50, 100, 300]"
      hover
      fixed-header
      width="true"
      class="scrollable-table"
      @update:page="onChangePage"
      @update:items-per-page="onUpdateItemsPerPage"
    >
      <template v-slot:item.color="{ item }">
        <v-icon :color="item.color" size="24">mdi-circle</v-icon>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script>
import { format, parseISO } from 'date-fns'
import HistoryDamagedModal from './Modal.vue'
import { QrCodeApi } from '../api/qr-code'

export default {
  components: {
    EditToolModal: HistoryDamagedModal,
  },
  emits: ['changes-saved'],

  data() {
    return {
      openDialog: false,
      filters: {
        itemsPerPage: 15,
        currentPage: 1,
      },
      isLoading: false,
      showModal: false,
      toolsHistory: [],
      editingToolId: null,
      totalCount: 0,
      headers: [
        { title: 'ID', value: 'id', sortable: false },
        { title: 'ID Спецификации', value: 'specs_nom_id', sortable: false },
        {
          title: 'ID Операции',
          value: 'specs_nom_operations_id',
          sortable: false,
        },
        { title: 'Цвет', value: 'color', sortable: false },
        { title: 'Статус', value: 'status', sortable: false },
        { title: 'Смена', value: 'smena', sortable: false },
        { title: 'Размеры', value: 'sizes', sortable: false },
        {
          title: 'Дата создания',
          value: 'created_at',
          sortable: false,
        },
        {
          title: 'Кол-во коробок',
          value: 'quantity_box',
          sortable: false,
        },
        {
          title: 'Кол-во произведенного',
          value: 'quantity_prod',
          sortable: false,
        },
      ],
    }
  },

  async mounted() {
    await this.fetchAndFormatToolHistory()
  },

  methods: {
    async onChangePage(page) {
      this.filters.currentPage = page
      await this.fetchAndFormatToolHistory()
    },

    async onUpdateItemsPerPage(itemsPerPage) {
      this.filters.itemsPerPage = itemsPerPage
      await this.fetchAndFormatToolHistory()
    },

    formatDate(date) {
      return format(parseISO(date), 'dd.MM.yy HH:mm') // Используйте HH для часов в 24-часовом формате
    },

    async fetchAndFormatToolHistory() {
      try {
        this.isLoading = true
        const response = await QrCodeApi.getQrCodeData(
          this.filters.currentPage,
          this.filters.itemsPerPage
        )

        // Проверка response и response.data на undefined
        if (response) {
          this.toolsHistory = response.data.map((tool) => ({
            ...tool,
            created_at: tool.created_at
              ? this.formatDate(tool.created_at)
              : null,
          }))
          this.totalCount = response.totalCount
        } else {
          console.error('API request returned empty or invalid data:', response)
        }
      } catch (error) {
        console.error('Error fetching tool history:', error)
      } finally {
        this.isLoading = false
      }
    },

    onClosePopup() {
      this.openDialog = false
    },

    onSaveChanges() {
      this.openDialog = false
      this.$emit('changes-saved')
    },
  },
}
</script>

<style>
.scrollable-table {
  height: 74vh; /* Замените это значение на желаемую высоту */
  overflow-y: auto;
}
</style>
