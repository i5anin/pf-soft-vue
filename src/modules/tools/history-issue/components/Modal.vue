<template>
  <Modal :title="popupTitle" width-default="1450px">
    <template #content>
      <div style="padding-left: 16px">
        <v-row>
          <div>
            <v-row align="center" class="ml-3 py-4">
              <v-col cols="auto" class="d-flex align-center">
                <v-icon
                  v-if="info?.is_archive"
                  icon="mdi-archive check-icon--large--gray"
                  class="mr-2"
                  title="В архиве"
                />
              </v-col>
              <v-col class="d-flex align-center">
                <!-- Обновить -->
                <v-btn
                  color="blue darken-1"
                  variant="text"
                  class="text-none text-subtitle-1 mr-4"
                  @click="fetchHistoryData"
                >
                  Обновить
                </v-btn>

                <!-- Архив (условие отображения перемещено непосредственно к v-checkbox) -->
                <v-checkbox
                  v-if="userRole === 'Editor' || userRole === 'Admin'"
                  v-model="info.is_archive"
                  label="Архив"
                  @change="toggleArchiveStatus"
                />
              </v-col>
            </v-row>
            <v-col cols="12" class="my-2">
              <div>
                Прогресс:
                <v-chip
                  v-for="item in operations"
                  :key="item + 'progress'"
                  :color="completedOperations.includes(item) ? 'green' : 'grey'"
                  :variant="
                    completedOperations.includes(item) ? 'elevated' : 'text'
                  "
                  class="ma-2"
                  outlined
                >
                  {{ item }}
                </v-chip>
              </div>
            </v-col>
          </div>
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
      <v-table hover="true" class="elevation-1">
        <thead>
          <tr>
            <th>#</th>
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
            v-for="(item, index) in filteredData"
            :key="item.id"
            :class="{ 'bg-blue-darken-2': item.type === 'sum' }"
          >
            <td class="grey">{{ index + 1 }}</td>
            <td v-for="header in currentHeaders" :key="header.value">
              <template
                v-if="
                  header.value === 'name_tool' &&
                  item &&
                  selectedTool &&
                  item.id_tool === selectedTool.id_tool
                "
              >
                <v-chip
                  v-if="item.id_tool === selectedTool.id_tool"
                  color="green"
                  size="large"
                  text-color="white"
                >
                  {{ item[header.value] }}
                </v-chip>
                <span v-else>
                  {{ item[header.value] }}
                </span>
              </template>
              <template v-else-if="header.value === 'cancelled'">
                <template v-if="item.cancelled">
                  {{ item.canceller_login }}
                </template>
                <template v-else>
                  <v-btn
                    variant="tonal"
                    size="x-small"
                    icon
                    small
                    color="error"
                    @click.stop="promptCancelQuantity(item.id)"
                  >
                    <!-- :disabled="new Date() - new Date(item.timestamp) > 432000000"-->
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </template>
              </template>
              <template v-else-if="header.value === 'timestamp'">
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
    <v-dialog v-model="showCancelDialog" persistent="true" max-width="350">
      <v-card>
        <v-card-title class="headline">Подтверждение отмены</v-card-title>
        <v-card-text>
          Введите для отмены:
          <v-text-field
            v-model="cancelQuantity"
            type="number"
            label="Количество"
            :rules="[(v) => v > 0 || 'Введите положительное число']"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green darken-1"
            text="true"
            @click="confirmCancelOperation"
          >
            Подтвердить
          </v-btn>
          <v-btn
            color="red darken-1"
            text="true"
            @click="showCancelDialog = false"
          >
            Отмена
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="showErrorSnackbar" color="error" :timeout="15000">
      {{ errorMessage }}
    </v-snackbar>
  </Modal>
</template>

<script>
import { authApi } from '@/api/login'
import Modal from '@/modules/tools/shared/components/Modal.vue'
import { issueHistoryApi } from '../api/history'
import { format, parseISO } from 'date-fns'

export default {
  name: 'HistoryModal',
  components: { Modal },
  props: {
    idPart: { type: Number, default: null },
    selectedDate: { type: String, default: '' },
    selectedTool: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['canceled', 'operation-cancelled'],
  data() {
    return {
      showErrorSnackbar: false,
      errorMessage: '',
      info: { is_archive: false },
      userRole: null,
      showCancelDialog: false,
      cancelQuantity: 1,
      selectedOperationQuantity: 100,
      operations: [],
      completedOperations: [],
      originalData: [],
      selectedOperation: 'all',
      availableOperations: [],
      headers: [
        { title: 'Инструмент', value: 'name_tool' },
        { title: 'Кол-во выдано', value: 'quantity', width: '90px' },
        { title: 'Сейчас склад', value: 'current_stock' },
        { title: 'Выдано', value: 'user_fio' },
        { title: 'Тип выдачи', value: 'type_issue' },
        { title: 'Дата время', value: 'timestamp' },
        { title: 'Тип', value: 'type_oper' },
        { title: 'Выдал', value: 'issuer_fio' },
        { title: 'Отмена', value: 'cancelled' },
      ],
      filteredData: [],
    }
  },
  computed: {
    popupTitle() {
      return this.info
        ? `${this.info.name} ${this.info.description} (партия ${this.idPart})`
        : 'Информация о партии'
    },
    currentHeaders() {
      return this.selectedOperation === 'all' ? this.headersAll : this.headers
    },
    headersAll() {
      return [
        { title: 'Инструмент', value: 'name_tool' },
        { title: 'Дата первой выдачи', value: 'timestamp' },
        { title: 'Кол-во', value: 'quantity', width: '90px' },
      ]
    },
  },
  created() {
    this.fetchHistoryData()
    this.checkLogin()
  },
  methods: {
    async checkLogin() {
      const token = localStorage.getItem('token')
      try {
        const response = await authApi.checkLogin(token)
        if (response.status === 'ok') {
          // Сохраняем роль пользователя после успешной проверки логина
          this.userRole = response.role
        }
      } catch (error) {
        console.error('Ошибка при проверке логина:', error)
      }
    },
    async toggleArchiveStatus() {
      const archiveState = this.info.is_archive
      const token = localStorage.getItem('token') // Получаем токен из localStorage
      try {
        await issueHistoryApi.addToArchive(this.idPart, archiveState, token)
        alert(`Статус архива для idPart ${this.idPart} успешно обновлен.`)
        await this.fetchHistoryData()
      } catch (error) {
        console.error('Ошибка при изменении статуса архива:', error)
        alert('Произошла ошибка при изменении статуса архива.')
      }
    },
    promptCancelQuantity(operationId) {
      this.currentOperationId = operationId
      this.showCancelDialog = true
    },
    async confirmCancelOperation() {
      this.showCancelDialog = false
      await this.cancelOperation(this.currentOperationId)
    },
    async cancelOperation(operationId) {
      if (!operationId) {
        console.error('Invalid operation ID:', operationId)
        this.errorMessage = 'Internal error: The operation ID is invalid.'
        this.showErrorSnackbar = true
        return
      }

      if (
        !confirm(
          `Вы уверены, что хотите отменить ${this.cancelQuantity} из этой операции?`
        )
      ) {
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token not found in local storage.')
        this.errorMessage = 'Ошибка авторизации: Токен не найден.'
        this.showErrorSnackbar = true
        return
      }

      try {
        const response = await issueHistoryApi.cancelOperation(
          operationId,
          token,
          this.cancelQuantity
        )

        if (response.success) {
          const item = this.filteredData.find((x) => x.id === operationId)
          if (item) {
            item.cancelled = true
            item.canceller_login = response.canceller_login
          }

          this.errorMessage = 'Операция успешно отменена'
          this.showErrorSnackbar = true
          this.$emit('operation-cancelled', operationId)
          await this.fetchHistoryData()
        } else {
          // Обработка ответа с success: false (возможно, есть message от сервера)
          this.errorMessage =
            'Не удалось отменить операцию: ' +
            (response.message || 'Неизвестная ошибка')
          this.showErrorSnackbar = true
        }
      } catch (error) {
        console.error('Ошибка при отмене операции:', error)

        if (error.response && error.response.status === 403) {
          // Ошибка 403 (Forbidden) - выводим сообщение от сервера
          this.errorMessage =
            error.response.data.message || 'Отмена операции запрещена.'
        } else {
          // Другие ошибки
          this.errorMessage =
            'Ошибка при отмене операции: ' +
            (error.message || 'Неизвестная ошибка')
        }
        this.showErrorSnackbar = true
      }
    },
    filterData() {
      if (this.selectedOperation === 'all') {
        this.filteredData = this.originalData['all'] || []
      } else {
        this.filteredData = this.originalData[this.selectedOperation] || []
      }
    },
    formatDate(date) {
      try {
        return format(parseISO(date), 'dd.MM.yy HH:mm:ss')
      } catch (error) {
        console.error('Error formatting date:', error)
        return 'Invalid Date'
      }
    },
    onCancel() {
      this.$emit('canceled')
    },
    async fetchHistoryData() {
      try {
        const response = await issueHistoryApi.fetchHistoryByPartId(
          this.idPart,
          this.selectedDate
        )
        const partInfoResponse = await issueHistoryApi.fetchHistoryByPartIdInfo(
          this.idPart
        )
        this.operations = partInfoResponse.info.operations
        this.completedOperations = partInfoResponse.info.completed_operations
        if (response && typeof response === 'object') {
          this.info = partInfoResponse.info
          this.originalData = response
          this.availableOperations = Object.keys(this.originalData).filter(
            (key) => key !== 'info'
          )
          this.filterData()
        } else {
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

<style>
.check-icon--large--gray {
  font-size: 24px;
  color: #848484;
}
</style>
