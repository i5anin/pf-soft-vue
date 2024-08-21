<template>
  <Modal :title="popupTitle" width-default="1550px">
    <template #content>
      <v-container>
        <!--        <span v-if="cartItems && cartItems.length > 0">-->
        <!--          {{ cartItems[0]?.name }}-->
        <!--        </span>-->
        <v-table hover>
          <thead>
            <tr>
              <th />
              <!--              <th>Инструмент</th>-->
              <th>Дата</th>
              <th>Комментарий</th>
              <th>Было</th>
              <th>Стало</th>
              <th>Изменение</th>
              <th>Выдал/Внёс</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in cartItems" :key="item.id">
              <td class="gray">{{ index + 1 }}</td>
              <!-- <td>{{ item.name }}</td>-->
              <td>{{ item.date }}</td>
              <td>{{ item.comment }}</td>
              <td style="color: grey">{{ item.was }}</td>
              <td style="color: grey">{{ item.now }}</td>
              <td>
                <v-icon v-if="item.change > 0" small color="green" class="pr-3">
                  mdi-arrow-up
                </v-icon>
                <v-icon v-if="item.change < 0" small color="red" class="pr-3">
                  mdi-arrow-down
                </v-icon>
                <span v-if="item.change !== 0">{{ item.change }}</span>
              </td>
              <td>{{ item.user }}</td>
            </tr>
          </tbody>
        </v-table>
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
    </template>
  </Modal>
  <!-- v-snackbar для отображения сообщений об ошибке -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" bottom right>
    {{ snackbar.text }}
    <v-btn color="white" text @click="snackbar.show = false">Закрыть</v-btn>
  </v-snackbar>
</template>

<script>
import Modal from '@/modules/tools/shared/components/Modal.vue'
import { getToolParams } from '@/api'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { editorToolApi } from '../api/view'
import { format, parseISO } from 'date-fns'

// editorToolApi.getToolMovementById - содержит данные просто их вставь!

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
      cartItems: [],
      snackbar: {
        show: false,
        color: 'error',
        text: '',
      },
      toolModel: {
        name: null,
        property: {},
        limit: null,
        sklad: null,
        norma: null,
      },
      toolNameOptions: [],
      parameterValuePairs: [{ parameter: null, value: null }],
      toolParamOptions: [],
      toolParamsOptions: {},
      selectedParams: [],
      toolParams: [],
      confirmDeleteDialog: false,
      typeSelected: false,
      selectedType: '',
      parentIdRules: [
        (v) => !!v || 'ID папки обязательно',
        (v) => v > 1 || 'ID папки должен быть больше 1',
        (v) => v !== '' || 'ID папки не должен быть пустым',
      ],
      typeRules: [
        (v) => !!v || 'Поле обязательно для заполнения',
        (v) => (v && v.length >= 3) || 'Минимальная длина: 3 символа',
      ],
    }
  },
  computed: {
    ...mapGetters('EditorToolStore', ['nameOptions', 'tool', 'parentCatalog']),
    availableToolParamOptions() {
      // Фильтрация toolParamOptions, чтобы показывать только те, которые еще не выбраны
      return this.toolParamOptions.filter(
        (option) => !this.selectedParams.includes(option)
      )
    },
    isAddButtonVisible() {
      const uniqueSelectedParamsCount = new Set(
        Object.keys(this.toolModel.property)
      ).size
      const totalAvailableParams = this.toolParams.length
      return uniqueSelectedParamsCount < totalAvailableParams
    },
    selectedParamsInfo() {
      // Возвращаем информацию о выбранных параметрах на основе текущего состояния toolModel.property
      return Object.entries(this.toolModel.property)
        .map(([key, value]) => {
          const param = this.toolParams.find(
            (param) => param.id.toString() === key
          )
          return param ? { ...param, value } : null
        })
        .filter((param) => param !== null)
    },
    popupTitle() {
      return this.tool?.id != null
        ? `Движение инструмента на складе: ${this.cartItems[0]?.name} (ID: ${this.tool.id})`
        : 'Движение инструмента'
    },
  },
  watch: {
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
    await this.fetchToolMovement()
    await this.fetchToolParamsByParentId(this.parentCatalog.id)
    await this.fetchToolNamesByParentId(this.parentCatalog.id)
    try {
      // Получение списка параметров инструмента
      const rawToolParams = await getToolParams()
      this.toolParams = [...rawToolParams]
      this.toolParamOptions = rawToolParams.map((param) => param.info) // Предполагается, что каждый параметр содержит поле info

      // Если модель инструмента уже содержит выбранные параметры, обновите selectedParams
      if (
        this.toolModel.property &&
        Object.keys(this.toolModel.property).length > 0
      ) {
        const propertyIds = Object.keys(this.toolModel.property)
        this.selectedParams = this.toolParams
          .filter((param) => propertyIds.includes(String(param.id)))
          .map((param) => param.info)
      }
    } catch (error) {
      console.error('Ошибка при загрузке параметров инструмента:', error)
    }

    // this.initializeLocalState()
    if (this.toolId == null) {
      this.setTool({
        id: null,
        name: null,
        property: {},
      })
    } else {
      await this.fetchToolById(this.toolId)
      if (this.tool && this.tool.property === null) {
        this.tool.property = {}
      }
    }
  },
  methods: {
    ...mapActions('EditorToolStore', ['fetchToolsByFilter', 'fetchToolById']),
    ...mapMutations('EditorToolStore', ['setTool']),

    formatDate(date) {
      // замените 'dd.MM.yyyy hh:mm' на нужный вам формат даты и времени
      return format(parseISO(date), 'dd.MM.yy HH:mm:ss')
    },
    async fetchToolMovement() {
      if (this.toolId) {
        try {
          const data = await editorToolApi.getToolMovementById(this.toolId)
          this.cartItems = data.map((item) => ({
            id: item.log_id,
            name: item.tool_name,
            date: this.formatDate(item.datetime_log),
            was: item.old_amount,
            now: item.new_amount,
            change: item.new_amount - (item.old_amount || item.new_amount), // Если old_amount == null, то изменение = 0
            comment: item.message,
            user: item.user_login || 'Неопределен', // Предоставим значение по умолчанию, если user_login равен null
          }))
        } catch (error) {
          console.error(
            'Ошибка при получении данных о движении инструмента:',
            error
          )
          this.showErrorSnackbar('Ошибка загрузки данных.')
        }
      }
    },
    showErrorSnackbar(message) {
      this.snackbar.text = message
      this.snackbar.color = 'error'
      this.snackbar.show = true
    },
    async fetchToolNamesByParentId(parentId) {
      try {
        this.toolNameOptions =
          await editorToolApi.getToolNamesByParentId(parentId)
      } catch (error) {
        console.error('Ошибка при получении названий инструментов:', error)
      }
    },

    async fetchToolParamsByParentId(parentId) {
      try {
        const paramsData = await editorToolApi.getToolParamsByParentId(parentId)
        // Создаем новый объект для обновления, чтобы обеспечить реактивность
        let newToolParamsOptions = {}
        paramsData.forEach((item) => {
          newToolParamsOptions[item.id] = item.values
        })
        // Прямое обновление toolParamsOptions
        this.toolParamsOptions = newToolParamsOptions
      } catch (error) {
        console.error('Ошибка при получении данных о параметрах:', error)
      }
    },
    removeParameter(id) {
      // Запрашиваем подтверждение у пользователя
      if (window.confirm('Вы уверены, что хотите удалить этот параметр?')) {
        // Удаляем параметр из toolModel.property, если пользователь подтвердил удаление
        delete this.toolModel.property[id]

        // Обновляем состояние, чтобы Vue мог отреагировать на изменения
        this.toolModel.property = { ...this.toolModel.property }

        // Обновляем selectedParams и selectedParamsInfo
        this.updateSelectedParams()
      }
    },

    selectParam(paramInfo) {
      const selectedParam = this.toolParams.find((p) => p.info === paramInfo)
      if (selectedParam) {
        // Удаляем временный ключ, если он был использован
        const newProperty = { ...this.toolModel.property }
        delete newProperty[-1]

        // Обновляем значение выбранного параметра
        newProperty[selectedParam.id] = this.toolModel.property[-1] || ''

        this.toolModel.property = newProperty

        // Важно! Обновляем список selectedParams после выбора параметра
        this.updateSelectedParams()
      }
    },
    updateSelectedParams() {
      this.selectedParams = Object.keys(this.toolModel.property)
        .map((id) => {
          const param = this.toolParams.find((param) => String(param.id) === id)
          return param ? param.info : null
        })
        .filter((info) => info !== null)
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
    addParameterValuePair() {
      // Проверяем, существует ли уже параметр с временным ID 0 в selectedParams
      if (!this.selectedParams.includes('-1')) {
        const newToolParam = { id: -1, info: null }
        this.toolParams.push(newToolParam)

        // Обновляем toolModel.property для добавления нового параметра с временным значением
        this.toolModel.property[newToolParam.id] = null

        // Обновляем selectedParams, чтобы включить новый временный параметр
        this.updateSelectedParams()
      }
    },
    updateToolModel() {
      if (this.tool) {
        this.toolModel = JSON.parse(JSON.stringify(this.tool))
      }
    },
    prependOptionIfNeeded(value, optionsList) {
      if (value && !optionsList.some((option) => option.value === value))
        optionsList.unshift(value)
    },
    prepareFioOptions(fioData) {
      return fioData.map((item) => ({
        text: item.fio,
        value: item.id,
      }))
    },
    confirmDelete() {
      if (window.confirm('Вы уверены, что хотите удалить этот инструмент?'))
        this.onDelete()
    },
    async onDelete() {
      // Предполагается, что метод onDelete вызывается, когда пользователь подтверждает удаление
      const { id } = this.toolModel
      if (id != null) {
        try {
          const response = await editorToolApi.deleteTool(id)
          if (response.success === 'OK') {
            this.$emit('changes-saved')
          }
        } catch (error) {
          console.error('Ошибка при удалении инструмента:', error)
          this.showErrorSnackbar('Инструмент используется в истории.')
        }
      }
    },
    onCancel() {
      this.$emit('canceled')
    },
  },
}
</script>
