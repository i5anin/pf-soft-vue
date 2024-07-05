<template>
  <v-table hover>
    <thead>
      <tr>
        <th>Дата</th>
        <th>Инструмент</th>
        <th>Выдал</th>
        <!-- Другие столбцы, которые вам нужны -->
      </tr>
    </thead>
    <tbody>
      <tr v-for="(historyItem, index) in historyItems" :key="index">
        <td>{{ historyItem.timestamp }}</td>
        <td>{{ historyItem.name_tool }}</td>
        <td>{{ historyItem.issuer_fio }}</td>
        <!-- Другие поля истории -->
      </tr>
    </tbody>
  </v-table>
</template>

<script>
import { issueToolApi } from '@/modules/tools/issue/api/issue'

export default {
  props: {
    operationId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      historyItems: [],
    }
  },
  async created() {
    await this.fetchToolHistory()
  },
  watch: {
    operationId(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.fetchToolHistory()
      }
    },
  },
  methods: {
    async fetchToolHistory() {
      try {
        const historyData = await issueToolApi.getToolHistoryByOperationId(this.operationId)
        this.historyItems = historyData // Здесь предполагается, что API возвращает массив объектов истории
      } catch (error) {
        console.error('Ошибка при получении истории по операции:', error)
        // Обработка ошибки при загрузке истории
      }
    },
  },
}
</script>

<style scoped>
/* Ваши стили для таблицы, если нужно */
</style>
