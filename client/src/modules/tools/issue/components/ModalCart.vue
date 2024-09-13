<template>
  <v-snackbar v-model="snackbar" :timeout="3000" color="error">
    {{ snackbarText }}
  </v-snackbar>
  <Modal
    :title="popupTitle"
    :width="modalWidth"
    transition="slide-x-reverse-transition"
  >
    <template #content>
      <v-container>
        <div class="d-flex">
          <div class="flex-grow-1 mr-2 ml-2" style="flex-basis: 40%">
            <div class="text-h6 pl-5 mb-2">Выбрать деталь:</div>
            <v-row>
              <v-col>
                <v-text-field
                  variant="outlined"
                  label="поиск детали по партии"
                  required
                  clearable
                  @update:model-value="onIdChanged"
                />
                <v-select
                  v-model="toolModel.detailDescription"
                  label="Название Обозначение"
                  required
                  :disabled="!options.idNameDescription.length"
                  :items="options.idNameDescription"
                  clearable
                  @update:model-value="onIdSelected"
                />

                <v-select
                  v-model="toolModel.numberType"
                  label="Номер Тип"
                  required
                  :disabled="!options.numberType.length"
                  :items="options.numberType"
                  item-value="id"
                  item-text="text"
                  clearable
                  @update:model-value="onOperationSelected"
                />
                <h2 class="text-h6 pl-5 mb-2">Кому выдать:</h2>
                <v-combobox
                  v-model="selectedFio"
                  icon="mdi-account"
                  :items="fioOptions"
                  item-title="text"
                  item-value="value"
                  label="ФИО"
                  clearable
                  @update:model-value="handleSelectionChange"
                />
                <!--fixme-->
                <v-combobox
                  v-model="toolModel.typeIssue"
                  :items="typeIssueOptions"
                  item-text="title"
                  item-value="id"
                  label="Тип выдачи"
                  :rules="issueTypeRules"
                  required
                  clearable
                />
              </v-col>
            </v-row>
            <v-table hover>
              <thead>
                <tr>
                  <th />
                  <th>Инструмент</th>
                  <th>Кол-во</th>
                  <th>Склад</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cartItem, index) in cartItems" :key="cartItem.id">
                  <td class="gray">{{ index + 1 }}</td>
                  <td>{{ cartItem.name }}</td>
                  <td>
                    <div class="d-flex align-center">
                      <v-btn
                        class="hover-effect-red"
                        icon="true"
                        size="x-small"
                        :disabled="cartItem.quantity <= 1"
                        @click="decreaseQuantity(index)"
                      >
                        <v-icon icon="mdi-minus" />
                      </v-btn>
                      <div class="mx-2">
                        {{ cartItem.quantity }}
                      </div>
                      <v-btn
                        class="hover-effect-red"
                        icon="true"
                        size="x-small"
                        :disabled="cartItem.quantity >= item.sklad"
                        @click="increaseQuantity(index)"
                      >
                        <v-icon icon="mdi-plus" />
                      </v-btn>
                    </div>
                  </td>
                  <td>{{ cartItem.sklad }}</td>
                  <td>
                    <v-btn
                      class="hover-effect-grey"
                      icon="true"
                      size="x-small"
                      @click="removeFromCartAction(cartItem.toolId)"
                    >
                      <v-icon icon="mdi-delete" />
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <div
            v-if="toolModel.operationType"
            class="flex-grow-1 ml-2"
            style="flex-basis: 60%"
          >
            <ModalTableOperaton :operation-id="toolModel.operationType" />
          </div>
        </div>
      </v-container>
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
      <v-spacer />
      <v-btn
        v-if="cartItemsTotalQuantity"
        prepend-icon="mdi-hand-extended"
        class="text-none text-subtitle-1 pl-3"
        color="blue darken-1"
        size="large"
        variant="flat"
        :disabled="submitButtonDisabled"
        @click="onSave"
      >
        Выдать
        <!-- Добавление класса ml-2 (margin left 2) для отступа -->
        <v-chip color="red" variant="flat" class="ml-2">
          {{ cartItemsTotalQuantity }} шт</v-chip
        >
      </v-btn>
    </template>
  </Modal>
</template>

<script>
import Modal from '@/modules/tools/shared/components/Modal.vue'
import ModalTableOperaton from './ModalTableOperaton.vue'
import { issueToolApi } from '@/modules/tools/issue/api/issue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { toolTreeApi } from '@/modules/tools/tree/api/tree'

export default {
  name: 'CartModal',
  components: { Modal, ModalTableOperaton },
  props: {
    persistent: { type: Boolean, default: false },
    toolId: { type: Number, default: null },
  },
  emits: ['canceled', 'changes-saved', 'updatePage'],
  data: () => ({
    selectedFio: null,
    typeIssueOptions: [
      { title: 'Себе', id: 0 },
      { title: 'На ночь', id: 1 },
      { title: 'Наладка', id: 2 },
    ],
    tree: [],
    issueToken: '',
    submitButtonDisabled: false,
    isSubmitting: false, // Для блокировки кнопки во время ожидания
    submitError: false, // Для изменения стиля кнопки при ошибке
    snackbar: false,
    snackbarText: '',
    item: { cnc_type: '', fio: '' },
    damagedQuantity: 1,
    comment: null,
    selectedCnc: null,
    cncList: [],
    originalData: [],
    idMapping: {},
    fioOptions: [],
    selectedData: {
      name: null,
      description: null,
      no: null,
      type: null,
    },
    localParentId: null,
    toolModel: {
      selectedOperationId: null,
      detailDescription: null,
      operationType: null, // Добавьте свойство для хранения operationType
    },
    selectedParams: [],
    toolParams: [],
    confirmDeleteDialog: false,
    typeSelected: false,
    selectedType: '',
    operationMapping: {},
    issueTypeRules: [(v) => !!v || 'Тип выдачи обязателен для выбора'],
    options: {
      idNameDescription: [],
      numberType: [],
    },
  }),
  computed: {
    ...mapGetters('IssueToolStore', [
      'nameOptions',
      'tool',
      'parentCatalog',
      'cartItems',
    ]),
    ...mapState('IssueToolStore', ['isModalOpen', 'parentCatalog']),
    selectedFioModel: {
      get() {
        return this.selectedFio // предполагается, что это значение из Vuex
      },
      set(value) {
        this.handleSelectionChange(value) // вызов метода для обновления Vuex хранилища
      },
    },
    cartItemsTotalQuantity() {
      return this.cartItems
        ? this.cartItems.reduce((total, item) => total + item.quantity, 0)
        : 0
    },
    currentFolderName() {
      return this.toolId === null ? this.idParent.label : this.tool.folder_name
    },

    popupTitle() {
      return 'Корзина'
    },
    modalWidth() {
      return this.toolModel.operationType ? '1200px' : '600px'
    },
  },
  watch: {
    'toolModel.detailDescription'(newValue, oldValue) {
      if (newValue !== oldValue) this.toolModel.operationType = null
    },
    tool: {
      deep: true,
      immediate: true,
      async handler(editingToolId) {
        if (editingToolId == null) {
          this.resetToolModel()
        } else {
          await this.fetchToolById(editingToolId)
          this.updateToolModel()
        }
      },
    },
  },

  async created() {
    try {
      const fioData = await issueToolApi.getDetailFio()
      this.fioOptions = this.prepareFioOptions(fioData)
    } catch (error) {
      console.error('Ошибка при загрузке данных ФИО:', error)
    }

    // Проверьте, нужно ли здесь ожидать завершения операции
    const toolsTree = await toolTreeApi.getTree()
    if (toolsTree && toolsTree.length > 0) {
      this.currentItem = toolsTree[0]
      if (this.currentItem) this.tree.push(this.currentItem)
    }
  },
  methods: {
    ...mapMutations('IssueToolStore', ['setTool']),
    ...mapActions('IssueToolStore', [
      'fetchToolsByFilter',
      'fetchToolById',
      'addToCartAction',
      'updateCartItemQuantityAction',
      'removeFromCartAction',
    ]),
    onOperationSelected(selectedValue) {
      const operationId = this.operationMapping[selectedValue]
      if (operationId) {
        this.toolModel.operationType = operationId // Установка ID операции, выбранной пользователем
      } else {
        console.error('Не удалось найти ID операции для:', selectedValue)
        this.toolModel.operationType = null
      }
    },
    formatToolOptions(data) {
      const uniqueSet = new Set()
      this.idMapping = {} // очистка предыдущего сопоставления

      data.forEach((item) => {
        const formattedItem = item.description
          ? `${item.id} - ${item.name} - ${item.description}`
          : `${item.id} - ${item.name}`

        if (!uniqueSet.has(formattedItem)) {
          uniqueSet.add(formattedItem)
          this.idMapping[formattedItem] = item.id // создание сопоставления
        }
      })

      return Array.from(uniqueSet)
    },

    handleSelectionChange(selectedItem) {
      this.selectedFio = selectedItem // Убедитесь, что здесь правильно обновляется значение в Vuex
    },

    onIdSelected(selectedValue) {
      const id = this.idMapping[selectedValue]
      if (id) {
        const filteredData = this.originalData.filter((item) => item.id === id)
        this.options.numberType = this.formatOperationOptions(filteredData)
        // Сбросить выбранное значение для "Номер Тип" каждый раз, когда выбирается новое "Название Обозначение"
        this.toolModel.operationType = null
        this.toolModel.numberType = null // Сбросить выбранный "Номер Тип"
      } else {
        console.error(
          'Не удалось найти ID для выбранного значения:',
          selectedValue
        )
        this.options.numberType = []
        this.toolModel.operationType = null
        this.toolModel.numberType = null // Сбросить выбранный "Номер Тип"
      }
    },
    async onIdChanged(newId) {
      try {
        const result = await issueToolApi.searchById(newId)
        this.originalData = result // Сохраняем исходные данные для последующего использования
        this.options.idNameDescription = this.formatToolOptions(result)
      } catch (error) {
        console.error('Ошибка при поиске:', error)
      }
    },

    async sendIssueDataToApi() {
      const clientTime = Date.now(); // Получаем clientTime здесь

      const issueData = {
        // Составление данных для отправки API
        issueToken: this.issueToken,
        operationId: this.toolModel.operationType,
        userId: this.selectedFio.value,
        typeIssue: this.toolModel.typeIssue.id,
        tools: this.cartItems.map((item) => ({
          toolId: item.toolId,
          quantity: item.quantity,
        })),
        clientTime: clientTime, // Добавляем clientTime к данным
      };

      try {
        const response = await issueToolApi.addHistoryTools(issueData)
        if (response && response.success === 'OK') {
          this.snackbarText = 'Успешно выдано'
          this.snackbar = true
          this.$emit('changes-saved')
          this.$emit('canceled')
          this.$store.dispatch('IssueToolStore/clearCart')
          return true
        }
      } catch (error) {
        this.snackbarText =
          error.message || 'Произошла ошибка при отправке данных'
        this.snackbar = true
        this.submitButtonDisabled = true
        setTimeout(() => {
          this.submitButtonDisabled = false
        }, 5000)
        return false
      }
    },
    async onSave() {
      this.isSubmitting = true
      try {
        this.issueToken = localStorage.getItem('token') // Move token retrieval here
        if (!this.issueToken) new Error('Authentication token not found.')
        const isSuccess = await this.sendIssueDataToApi()
        if (isSuccess) {
          this.snackbarText = 'Успешно выдано'
          this.snackbar = true
          this.$emit('changes-saved')
          this.$store.dispatch('IssueToolStore/clearCart')
          await this.fetchToolsByFilter() // Обновление данных таблицы
        }
      } catch (error) {
        console.error('Произошла ошибка при отправке данных:', error)
        this.snackbarText = 'Ошибка при отправке данных'
        this.snackbar = true
      } finally {
        this.isSubmitting = false
      }
    },

    increaseQuantity(index) {
      const item = this.cartItems[index]
      if (item.quantity < item.sklad) {
        this.updateCartItemQuantityAction({
          toolId: item.toolId,
          quantity: item.quantity + 1,
        })
      }
    },
    resetToolModel() {
      this.toolModel = {
        name: null,
        limit: null,
        sklad: null,
        norma: null,
        property: {},
      }
    },
    decreaseQuantity(index) {
      const item = this.cartItems[index]
      if (item.quantity > 1) {
        this.updateCartItemQuantityAction({
          toolId: item.toolId,
          quantity: item.quantity - 1,
        })
      }
    },

    prepareFioOptions(fioData) {
      return fioData.map((item) => ({
        text: item.fio,
        value: item.id,
      }))
    },

    formatOperationOptions(data) {
      const uniqueSet = new Set()
      data.forEach((item) => {
        const label = `${item.no} - ${item.cnc_type}`
        if (!uniqueSet.has(label)) {
          uniqueSet.add(label)
          this.operationMapping[label] = item.specs_op_id
        }
      })
      return Array.from(uniqueSet)
    },

    onCancel() {
      this.$emit('canceled')
    },
  },
}
</script>

<style>
.gray {
  color: grey;
}

.hover-effect-grey:hover {
  background-color: grey; /* Цвет фона при наведении */
  color: white; /* Цвет иконки или текста при наведении */
}

.hover-effect-red:hover {
  background-color: red; /* Цвет фона при наведении */
  color: white; /* Цвет иконки или текста при наведении */
}
</style>
