<template>
  <Modal :title="popupTitle">
    <template #content>
      <v-container>
        <v-row>
          <v-col>
            <!--левый столбец -->
            <div>
              <v-combobox
                v-model="toolModel.name"
                density="compact"
                label="Маркировка"
                item-text="text"
                item-value="value"
                required
                :rules="typeRules"
                readonly
                disabled
              />
            </div>
            <h2 class="text-h6">Деталь:</h2>
            <v-text-field
              density="compact"
              label="поиск по ID"
              required
              @update:model-value="onIdChanged"
            />
            <v-select
              v-model="toolModel.detailDescription"
              density="compact"
              label="Название Обозначение"
              required
              :disabled="!options.idNameDescription.length"
              :items="options.idNameDescription"
              @update:model-value="onIdSelected"
            />
            <v-select
              v-model="toolModel.operationType"
              density="compact"
              label="Номер Тип"
              required
              :disabled="!options.numberType.length"
              :items="options.numberType"
              @update:model-value="onOperationSelected"
            />
            <h2 class="text-h6">Кому выдать:</h2>
            <v-combobox
              v-model="selectedFio"
              :items="fioOptions"
              item-title="text"
              item-value="value"
              label="ФИО"
              return-object="false"
              single-line="false"
              @update:model-value="handleSelectionChange"
            />
            <v-combobox
              v-model="toolModel.typeIssue"
              :items="typeIssueOptions"
              item-text="title"
              item-value="id"
              label="Тип выдачи"
              return-object="false"
              single-line="false"
              :rules="issueTypeRules"
              required
            />
            <h2 class="text-h6">Сколько выдать:</h2>
            <v-text-field
              v-model="toolModel.issue"
              density="compact"
              label="Количество"
              required
              :rules="issueRules"
            />
            <v-textarea
              v-if="overNorm"
              v-model="comment"
              class="comment-field"
              label="Комментарий"
              rows="3"
              required
            />
            <h2 class="text-h6"></h2>
          </v-col>
        </v-row>
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
        prepend-icon="mdi-check-circle"
        class="text-none text-subtitle-1 pl-3"
        color="blue darken-1"
        size="large"
        variant="flat"
        @click="onSave"
      >
        Выдать
      </v-btn>
    </template>
  </Modal>
</template>

<script>
import Modal from '@/modules/tools/shared/components/Modal.vue'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { issueToolApi } from '@/modules/tools/issue/api/issue'

export default {
  name: 'FillingModal',
  components: { Modal },
  props: {
    persistent: { type: Boolean, default: false },
    toolId: { type: Number, default: null },
  },
  emits: ['canceled', 'changes-saved'],
  data() {
    return {
      typeIssueOptions: [
        { title: 'Себе', id: 0 },
        { title: 'На ночь', id: 1 },
        { title: 'Наладка', id: 2 },
      ],
      overNorm: false,
      originalData: [],
      idMapping: {},
      isModalOpen: true,
      selectedFio: null,
      fioOptions: [],
      selectedData: { name: null, description: null, no: null, type: null },
      localParentId: null,
      toolModel: {
        name: null,
        property: {},
        selectedOperationId: null,
        typeIssue: null,
      },
      selectedParams: [],
      toolParams: [],
      confirmDeleteDialog: false,
      typeSelected: false,
      selectedType: '',
      operationMapping: {},
      issueTypeRules: [(v) => !!v || 'Тип выдачи обязателен для выбора'],
      parentIdRules: [
        (v) => !!v || 'ID папки обязательно',
        (v) => v > 1 || 'ID папки должен быть больше 1',
        (v) => v !== '' || 'ID папки не должен быть пустым',
      ],
      typeRules: [
        (v) => !!v || 'Поле обязательно для заполнения',
        (v) => (v && v.length >= 3) || 'Минимальная длина: 3 символа',
      ],

      options: {
        idNameDescription: [],
        numberType: [],
      },
    }
  },
  computed: {
    ...mapGetters('IssueToolStore', ['nameOptions', 'tool', 'parentCatalog']),
    popupTitle() {
      return this.tool?.id != null
        ? `Выдать инструмент ID: ${this.tool.id}`
        : 'Добавить новый инструмент'
    },
  },
  watch: {
    'toolModel.detailDescription'(newValue, oldValue) {
      if (newValue !== oldValue) this.toolModel.operationType = null
    },
    toolId: {
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
    // Дополнительное логирование состояния после обработки
    this.initializeLocalState()
    if (this.toolId == null) {
      this.setTool({
        id: null,
        name: null,
        property: {},
      })
    } else {
      await this.fetchToolById(this.toolId)
      if (this.tool.property === null) this.tool.property = {}
    }
  },
  methods: {
    ...mapActions('IssueToolStore', ['fetchToolsByFilter', 'fetchToolById']),
    ...mapMutations('IssueToolStore', ['setTool']),

    onIdSelected(selectedValue) {
      const id = this.idMapping[selectedValue]
      if (id) {
        const filteredData = this.originalData.filter((item) => item.id === id)
        this.options.numberType = this.formatOperationOptions(filteredData)
      } else {
        console.error(
          'Не удалось найти ID для выбранного значения:',
          selectedValue
        )
      }
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

    onOperationSelected(value) {
      this.toolModel.selectedOperationId = this.operationMapping[value]
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
    updateToolModel() {
      if (this.tool) {
        this.toolModel = JSON.parse(JSON.stringify(this.tool))
      }
    },
    prepareFioOptions(fioData) {
      return fioData.map((item) => ({
        text: item.fio,
        value: item.id,
      }))
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
    initializeLocalState() {
      if (this.toolId) {
        this.fetchToolById(this.toolId).then(() => {
          this.toolModel.sklad = this.tool.sklad
          this.toolModel.norma = this.tool.norma
        })
      } else {
        this.currentFolderName = this.idParent.label
      }
    },
    onCancel() {
      this.$emit('canceled')
    },
    async onSave() {
      const token = localStorage.getItem('token') // Получаем токен из localStorage
      if (!token) {
        console.error('Токен не найден')
        return // Прерываем выполнение функции, если токен не найден
      }

      try {
        // Подготовка данных инструмента для истории
        const issueHistoryData = {
          specs_op_id: this.toolModel.selectedOperationId,
          id_user: this.selectedFio.value,
          id_tool: this.toolId,
          type_issue: this.toolModel.typeIssue.id,
          quantity: parseInt(this.toolModel.issue),
          issueToken: token,
        }
        // Отправка данных истории инструмента
        const response = await issueToolApi.addHistoryTool(issueHistoryData)
        if (response.success === 'OK') {
          this.$emit('changes-saved')
        } else {
          console.error(
            'Ошибка при сохранении данных на сервере: ',
            response.data
          )
        }
      } catch (error) {
        console.error(
          'Ошибка при отправке данных на сервер: ',
          error.response ? error.response.data : error
        )
      }
    },
  },
}
</script>
