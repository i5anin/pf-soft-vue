<template>
  <v-container>
    <div class='d-flex align-center justify-center'>
      <v-row class='fill-height'>
        <v-col cols='12' md='4'>
          <v-select
            v-model='selectedDate'
            clearable
            :items='dateOptions'
            item-value='value'
            item-title='title'
            label='Выберите дату'
            prepend-inner-icon='mdi-calendar'
            @update:model-value='fetchComingTools'
          />
        </v-col>
      </v-row>
    </div>
    <v-data-table-server
      v-if='comingTools.length > 0'
      class='scrollable-table'
      no-data-text='Нет данных'
      items-per-page-text='Пункты на странице:'
      loading-text='Загрузка данных'
      :headers='headers'
      :items-length='totalCount'
      :items='comingTools'
      :items-per-page='filters.itemsPerPage'
      :page='filters.currentPage'
      :loading='isLoading'
      :items-per-page-options='[15, 50, 100, 300]'
      hover
      fixed-header
      width='true'
      @update:page='onChangePage'
      @update:items-per-page='onUpdateItemsPerPage'
    >
      <template #item.index='{ index }'>
        <td style='color: grey;'>{{ calculateItemIndex(index) }}</td>
      </template>
      <template #item.datetime_log='{ item }'>
        <td>{{ formatDate(item.datetime_log) }}</td>
      </template>
      <template #item.tool_name='{ item }'>
        <td>{{ item.tool_name }}</td>
      </template>
      <template #item.user_name='{ item }'>
        <td>{{ item.user_name }}</td>
      </template>
      <template #item.coming='{ item }'>
        <td>{{ item.new_amount - item.old_amount }}</td>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script>
import { format, parseISO } from 'date-fns'
import { issueHistoryApi } from '../api/history'

export default {
  emits: ['error'],
  data() {
    return {
      selectedDate: null,
      dateOptions: [],
      filters: { itemsPerPage: 15, currentPage: 1 },
      isLoading: false,
      comingTools: [],
      totalCount: 0,
      headers: [
        {
          title: '№',
          value: 'index',
          sortable: false,
          width: '50px',
        },
        {
          title: 'Дата и время',
          value: 'datetime_log',
          sortable: false,
        },
        { title: 'Инструмент', value: 'tool_name', sortable: false },
        {
          title: 'Внесено',
          value: 'coming',
          sortable: false,
        },
        {
          title: 'Пользователь', value: 'user_name', sortable: false,
          width: '150px',
        },
      ],
    }
  },
  async mounted() {
    await this.fetchDateOptions()
    await this.fetchComingTools()
  },
  methods: {
    calculateItemIndex(index) {
      return (this.filters.currentPage - 1) * this.filters.itemsPerPage + index + 1
    },
    async fetchDateOptions() {
      this.isLoading = true

      try {
        const response = await issueHistoryApi.getDataComingTools()
        this.dateOptions = response.map((date) => ({
          value: date,
          title: this.formatDateForSelect(date),
        }))
      } catch (error) {
        console.error('Ошибка при получении списка дат:', error)
        this.$emit('error', error)
      } finally {
        this.isLoading = false
      }
    },

    formatDateForSelect(dateString) {
      const date = parseISO(dateString)
      return format(date, 'dd.MM.yyyy')
    },

    async onChangePage(page) {
      this.filters.currentPage = page
      await this.fetchComingTools()
    },

    async onUpdateItemsPerPage(itemsPerPage) {
      this.filters.itemsPerPage = itemsPerPage
      await this.fetchComingTools()
    },

    formatDate(date) {
      const parsedDate = parseISO(date)
      return format(parsedDate, 'dd.MM.yyyy HH:mm:ss')
    },

    async fetchComingTools() {
      this.isLoading = true

      try {
        const response = await issueHistoryApi.getComingTools(
          this.filters.currentPage,
          this.filters.itemsPerPage,
          this.selectedDate,
        )

        this.comingTools = response.comingTools
        this.totalCount = response.totalCount
      } catch (error) {
        console.error('Ошибка при получении данных о внесении инструментов:', error)
        this.$emit('error', error)
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>
