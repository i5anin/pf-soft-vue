<template>
  <v-container>
    <edit-tool-modal
      v-if="openDialog"
      :persistent="true"
      :id-part="editingToolId"
      :selected-date="selectedDate"
      :selected-tool="selectedTool"
      @canceled="onClosePopup"
      @changes-saved="fetchAndFormatToolHistory"
      @close="onClosePopup"
    />
    <div class="d-flex align-center justify-center">
      <v-row class="fill-height">
        <v-col cols="12" md="4" class="d-flex align-center">
          <v-text-field
            v-model="searchQuery"
            variant="outlined"
            clearable="true"
            label="Поиск по партии, названию, обозначению"
            class="flex-grow-1 mr-2"
            prepend-inner-icon="mdi-magnify"
            @input="debouncedFetchAndFormatToolHistory"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-combobox
            v-model="selectedTool"
            clearable="true"
            :items="toolOptions"
            item-value="id_tool"
            item-title="name"
            label="Выберите инструмент"
            prepend-inner-icon="mdi-box-cutter"
            @update:model-value="fetchAndFormatToolHistory"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedDate"
            clearable="true"
            :items="dateOptions"
            item-value="value"
            item-title="title"
            label="Выберите дату"
            prepend-inner-icon="mdi-calendar"
            @update:model-value="fetchAndFormatToolHistory"
          />
        </v-col>
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-checkbox
            v-model="showArchive"
            :label="'Показать архив'"
            hide-details
            @change="fetchAndFormatToolHistory"
          />
        </v-col>
      </v-row>
    </div>

    <v-data-table-server
      v-if="toolsHistory && toolsHistory.length > 0"
      class="scrollable-table"
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
      @update:page="onChangePage"
      @update:items-per-page="onUpdateItemsPerPage"
      @click:row="onInfoRow"
    >
      <template #item.id_part="{ item }">
        <td :class="{ 'item-in-archive': item.is_archive }">
          {{ item.id_part }}
        </td>
      </template>
      <template #item.name="{ item }">
        <td :class="{ 'item-in-archive': item.is_archive }">{{ item.name }}</td>
      </template>
      <template #item.description="{ item }">
        <td :class="{ 'item-in-archive': item.is_archive }">
          {{ item.description }}
        </td>
      </template>
      <template #item.first_issue_date="{ item }">
        <td :class="{ 'item-in-archive': item.is_archive }">
          {{ item.first_issue_date }}
        </td>
      </template>
      <template #item.check="{ item }">
        <span
          v-if="item.is_archive"
          class="mdi mdi-archive check-icon--large--gray"
          title="В архиве"
        />
        <span
          v-else-if="
            item.status_otgruzka && item.ready_count < item.operation_count
          "
          class="mdi mdi-help check-icon--large--red"
          title="Отгружено, не все операции завершены, не в производстве"
        />
        <span
          v-else-if="item.status_otgruzka"
          class="mdi mdi-truck-check check-icon--large--green"
          title="Отгружено"
        />
        <span
          v-else-if="
            item.quantity_prod >= item.quantity_prod_all && item.status_ready
          "
          class="mdi mdi-check check-icon--large--green"
          title="Произведено"
        />
        <span
          v-else-if="item.status_ready"
          class="mdi mdi-stop check-icon--large--yellow"
          title="Не в производстве"
        />
      </template>
      <template #item.operation_status="{ item }">
        {{ item.ready_count }} / {{ item.operation_count }}
      </template>
      <template #item.quantity_prod_all="{ item }">
        {{ item.quantity_prod }} / {{ item.quantity_prod_all }}
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script>
import { format, parseISO } from 'date-fns'
import EditToolModal from './Modal.vue'
import { issueHistoryApi } from '@/modules/tools/history-issue/api/history'

export default {
  components: { EditToolModal },
  emits: ['error'],
  data() {
    return {
      toolOptions: [],
      selectedTool: null,
      searchQuery: '',
      selectedDate: '',
      dateOptions: this.generateDateOptions(),
      date: '',
      debouncedFetchAndFormatToolHistory: null,
      openDialog: false,
      filters: { itemsPerPage: 15, currentPage: 1 },
      isLoading: false,
      showModal: false,
      toolsHistory: [],
      editingToolId: null,
      totalCount: 0,
      showArchive: false, // Флаг для показа архива
      headers: [
        { title: '', value: 'check', sortable: false },
        { title: 'Партия', value: 'id_part', sortable: false },
        { title: 'Название', value: 'name', sortable: false, width: '300px' },
        { title: 'Обозначение', value: 'description', sortable: false },
        {
          title: 'Дата первой выдачи',
          value: 'first_issue_date',
          sortable: false,
        },
        {
          title: 'Выдано инструмента',
          value: 'quantity_tool',
          sortable: false,
          width: '80px',
        },
        {
          title: 'Готовность операций',
          value: 'operation_status',
          sortable: false,
        }, // Новый столбец
        {
          title: 'Произведено / План',
          value: 'quantity_prod_all',
          sortable: false,
          width: '180px',
        },
      ],
    }
  },
  watch: {
    searchQuery(newQuery, oldQuery) {
      if (newQuery !== oldQuery) this.debouncedFetchAndFormatToolHistory()
    },
  },
  async mounted() {
    this.toolOptions = await issueHistoryApi.getAllIssuedToolIdsWithNames()
    await this.fetchAndFormatToolHistory()
  },
  created() {
    this.dateOptions = this.generateDateOptions()
    this.debouncedFetchAndFormatToolHistory = this.debounce(
      this.fetchAndFormatToolHistory,
      500
    )
  },
  methods: {
    generateDateOptions() {
      const options = [{ value: '', title: 'ВСЕ' }]
      const baseDate = new Date()
      baseDate.setHours(0, 0, 0, 0)
      // Установка времени на начало дня (полночь), чтобы избежать проблем с временными зонами

      for (let i = 0; i < 90; i++) {
        const date = new Date(baseDate)
        date.setDate(baseDate.getDate() - i) // Вычитаем дни для создания истории дат
        // Подготовка даты с учетом смещения временной зоны на +3 часа (переводим в UTC)
        const offsetDate = new Date(date.getTime() + 180 * 60000) // Прибавляем 180 минут (3 часа * 60 минут)
        const isoDate = offsetDate.toISOString().substring(0, 10)
        const formattedDate = offsetDate.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        const suffix = i === 0 ? ' - СЕГОДНЯ' : i === 1 ? ' - ВЧЕРА' : ''
        options.push({ value: isoDate, title: `${formattedDate}${suffix}` })
      }
      return options
    },
    debounce(func, wait) {
      let timeout
      return function (...args) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          func.apply(this, args)
        }, wait)
      }
    },

    async onChangePage(page) {
      this.filters.currentPage = page
      await this.fetchAndFormatToolHistory()
    },
    async onUpdateItemsPerPage(itemsPerPage) {
      this.filters.itemsPerPage = itemsPerPage
      await this.fetchAndFormatToolHistory()
    },
    formatDate(date) {
      return format(parseISO(date), 'dd.MM.yy')
    },
    async fetchAndFormatToolHistory() {
      this.isLoading = true

      try {
        let response = await issueHistoryApi.fetchToolHistory(
          this.searchQuery,
          this.filters.currentPage,
          this.filters.itemsPerPage,
          this.selectedDate ? this.selectedDate : null,
          this.selectedTool ? this.selectedTool.id_tool : null,
          this.showArchive // Передаем флаг showArchive в API
        )

        this.toolsHistory = response.toolsHistory.map((tool) => ({
          ...tool,
          first_issue_date: this.formatDate(tool.first_issue_date),
        }))
        this.totalCount = response.totalCount
      } catch (error) {
        console.error('Ошибка при получении истории инструментов:', error)
        this.$emit('error', error)
      } finally {
        this.isLoading = false
      }
    },
    onClosePopup() {
      this.openDialog = false
      this.fetchAndFormatToolHistory()
    },
    onInfoRow(_, { item: tool }) {
      this.editingToolId = tool.id_part
      this.openDialog = true
    },
    onSaveChanges() {
      this.fetchAndFormatToolHistory()
      this.openDialog = false
    },
    async updateArchiveStatus(idPart, isArchive) {
      try {
        await issueHistoryApi.updateArchiveStatus(idPart, isArchive)
        // Обновление данных в таблице после изменения статуса архива
        await this.fetchAndFormatToolHistory()
      } catch (error) {
        console.error('Ошибка при обновлении статуса архива:', error)
        this.$emit('error', error)
      }
    },
  },
}
</script>

<style>
.scrollable-table {
  height: 74vh; /* Замените это значение на желаемую высоту */
  overflow-y: auto;
}

.check-icon--large--yellow {
  font-size: 16px; /* или любой другой размер, который вам нужен */
  color: #cfcf00; /* Пример изменения цвета */
}

.check-icon--large--green {
  font-size: 24px; /* или любой другой размер, который вам нужен */
  color: #009500; /* Пример изменения цвета */
}

.check-icon--large--red {
  font-size: 24px; /* или любой другой размер, который вам нужен */
  color: #950000; /* Пример изменения цвета */
}

.check-icon--large--gray {
  font-size: 24px; /* или любой другой размер, который вам нужен */
  color: #848484; /* Пример синего цвета */
}

.item-in-archive {
  color: #848484; /* Цвет текста серый */
}
</style>
