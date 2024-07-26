<template>
  <div class="text-h6">Уже было выдано на операцию</div>
  <v-table hover>
    <template v-slot:default>
      <thead>
        <tr>
          <th v-for="(header, index) in tableStructure" :key="index">
            {{ header.header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(historyItem, index) in historyItems"
          :key="index"
          :class="{ 'highlight-row': isToolInCart(historyItem.id_tool) }"
        >
          <td v-for="(field, fieldIndex) in tableStructure" :key="fieldIndex">
            {{
              field.data === 'timestamp'
                ? formatDate(historyItem[field.data])
                : historyItem[field.data]
            }}
          </td>
        </tr>
      </tbody>
    </template>
  </v-table>
</template>

<script>
import { issueToolApi } from '@/modules/tools/issue/api/issue'
import { format } from 'date-fns'
import { mapGetters } from 'vuex'

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
      tableStructure: [
        { header: 'Дата', data: 'timestamp' },
        { header: 'Инструмент', data: 'name_tool' },
        { header: 'Кол-во', data: 'quantity' },
        { header: 'Тип выдачи', data: 'type_issue' },
        { header: 'Выдал', data: 'issuer_fio' },
        { header: 'Выдано', data: 'user_fio' },
      ],
    }
  },
  computed: {
    ...mapGetters('IssueToolStore', ['cartItems']), // Получение cartItems из Vuex
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
        this.historyItems = await issueToolApi.getToolHistoryByOperationId(this.operationId)
      } catch (error) {
        // Обработка ошибки 404
        if (error.response && error.response.status === 404) {
          this.historyItems = []
        } else {
          console.error('Ошибка при получении истории по операции:', error)
          // Обработка других ошибок
        }
      }
    },
    formatDate(timestamp) {
      return format(new Date(timestamp), 'dd.MM.yy HH:mm')
    },
    isToolInCart(toolId) {
      // Проверка наличия инструмента в корзине
      console.log(toolId)
      return this.cartItems.some((item) => item.toolId === toolId)
    },
  },
}
</script>

<style scoped>
/* Добавляем скроллинг к таблице */
.v-table {
  height: 75vh;
  overflow-y: auto;
}

/* Стиль для подсветки строки */
.highlight-row {
  background-color: #bf6161; /* Цвет фона */
}
</style>
