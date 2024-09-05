<template>
  <Modal :title="popupTitle" width-default="1300px">
    <template #content>
      <div style="padding-left: 16px">
        <v-row>
          <h2 v-if="info" style="padding-left: 25px">
            {{ info.name }} {{ info.description }}
          </h2>
          <v-spacer />
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedOperation"
              label="Операция"
              :items="availableOperations"
              solo
              @update:model-value="filterData"
            />
          </v-col>
        </v-row>
      </div>
      <v-table class="elevation-1">
        <thead>
          <tr>
            <th
              v-for="header in currentHeaders"
              :key="header.value"
              class="text-left"
            >
              {{ header.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredData"
            :key="item.id"
            :class="{ 'bg-blue-darken-2': item.type === 'sum' }"
          >
            <td v-for="header in currentHeaders" :key="header.value">
              <template v-if="header.value === 'date'">
                {{ formatDate(item[header.value]) }}
              </template>
              <template v-else>
                {{ item[header.value] }}
              </template>
            </td>
          </tr>
        </tbody>
      </v-table>
    </template>
    <template #action>
      <v-btn
        color="red darken-1"
        variant="text"
        class="text-none text-subtitle-1 ml-3"
        @click="onCancel"
      >
        Закрыть
      </v-btn>
    </template>
  </Modal>
</template>

<script>
import Modal from '@/modules/tools/shared/components/Modal.vue'
import { format, parseISO } from 'date-fns'
import { issueHistoryApi } from '@/modules/tools/history-issue/api/cancel'

export default {
  name: 'HistoryModal',
  components: { Modal },
  props: {
    idPart: { type: Number, default: null },
  },
  emits: ['canceled', 'operation-cancelled'],
  data() {
    return {
      info: null,
      originalData: [],
      selectedOperation: 'all',
      availableOperations: [],
      headers: [
        { title: 'Инструмент', value: 'name_tool' },
        { title: 'Кол-во', value: 'quantity', width: '90px' },
        { title: 'Выдано', value: 'user_fio' },
        { title: 'Дата', value: 'date' },
        { title: 'Операция', value: 'no_oper' },
        { title: 'Тип', value: 'type_oper' },
      ],
      headersAll: [
        { title: 'Инструмент', value: 'name_tool' },
        { title: 'Дата начальная', value: 'date' },
        { title: 'Кол-во', value: 'quantity', width: '90px' },
      ],
      filteredData: [],
      showOperationModal: false,
      currentNoOper: null,
    }
  },
  computed: {
    popupTitle() {
      return `Инструмент затраченный на партию: ${this.id_part}`
    },
    currentHeaders() {
      if (this.selectedOperation === 'all') {
        return this.headersAll
      } else {
        return this.headers
      }
    },
  },
  created() {
    this.fetchHistoryData()
  },
  methods: {
    filterData() {
      this.filteredData =
        this.selectedOperation === 'all'
          ? this.originalData['all'] || []
          : this.originalData[this.selectedOperation] || []
    },
    formatDate(date) {
      try {
        return format(parseISO(date), 'dd.MM.yy HH:mm:ss')
      } catch (error) {
        console.error('Error formatting date:', error, 'Date:', date)
        return 'Invalid Date'
      }
    },
    onCancel() {
      this.$emit('canceled')
    },
    async fetchHistoryData() {
      try {
        const response = await issueHistoryApi.fetchHistoryByPartId(
          this.id_part
        )
        this.info = response.info
        if (response && typeof response === 'object') {
          // Removing the 'info' key from the response object
          const { ...operations } = response
          this.originalData = operations
          this.filteredData = operations['all'] || []
          this.availableOperations = Object.keys(operations)
        } else {
          this.originalData = {}
          this.filteredData = []
          this.availableOperations = ['all']
        }
      } catch (error) {
        console.error('Error fetching history data:', error)
      }
    },
  },
}
</script>
