<template>
  <template #content>
    <v-container>
      <v-row>
        <v-col>
          <h2 class="text-h6">Характеристики:</h2>
          <div v-for="(param, index) in selectedParamsInfo" :key="param.id">
            <v-container>
              <v-row>
                <v-select
                  v-model="param.info"
                  :items="availableToolParamOptions"
                  label="Параметр"
                  single-line="true"
                  solo
                  @update:model-value="(value) => selectParam(value, index)"
                />
                <v-combobox
                  v-model="toolModel.property[param.id]"
                  label="Значение"
                  clearable="true"
                  single-line="true"
                  solo
                />
                <v-btn icon @click="removeParameter(param.id)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-row>
            </v-container>
          </div>
          <v-btn
            v-show="isAddButtonVisible"
            color="primary"
            @click="addParameterValuePair"
          >
            Добавить
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </template>
  <template #action>
    <v-btn
      color="red darken-1"
      variant="text"
      class="text-none text-subtitle-1 ml-3"
      @click="confirmDelete"
    >
      Удалить
    </v-btn>
    <v-spacer />
    <v-btn
      color="red darken-1"
      variant="text"
      class="text-none text-subtitle-1 ml-3"
      @click="onCancel"
    >
      Закрыть
    </v-btn>
    <v-btn
      prepend-icon="mdi-check-circle"
      class="text-none text-subtitle-1 pl-3"
      color="blue darken-1"
      size="large"
      variant="flat"
      @click="onSave"
    >
      Сохранить
    </v-btn>
  </template>
</template>

<script>
import { getToolParams } from '@/api'
import { editorToolApi } from '../api/editor'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { issueToolApi } from '@/modules/tools/issue/api/issue'

export default {
  name: 'FillingModal',
  props: {
    persistent: { type: Boolean, default: false },
    toolId: { type: Number, default: null },
  },
  emits: ['canceled', 'changes-saved'],
  data() {
    return {
      toolModel: {
        name: null,
        property: {},
        sklad: null,
        norma: null,
      },
      toolParamOptions: [], //"Тип", "Группа", "Материал", "Ширина", "Габарит", "Шаг", "Длинна общая", "Длинна рабочей части", "Порядковый номер", "Диаметр хвостовика", "Диаметр", "Радиус", "Геометрия"
      selectedParams: [], // уже выбранные параметры ["Тип", "Группа", "Материал", "Диаметр", "Геометрия"]
      toolParams: [], //глобальные параметры [ { "id": 1, "info": "Тип" }, { "id": 2, "info": "Группа" }, { "id": 3, "info": "Материал" }, { "id": 4, "info": "Ширина" }, { "id": 5, "info": "Габарит" }, { "id": 6, "info": "Шаг" }, { "id": 7, "info": "Длинна общая" }, { "id": 8, "info": "Длинна рабочей части" }, { "id": 9, "info": "Порядковый номер" }, { "id": 10, "info": "Диаметр хвостовика" }, { "id": 11, "info": "Диаметр" }, { "id": 12, "info": "Радиус" }, { "id": 13, "info": "Геометрия" } ]
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
    ...mapGetters('EditorToolStore', ['tool', 'parentCatalog']),

    isAddButtonVisible() {
      const uniqueSelectedParamsCount = new Set(
        Object.keys(this.toolModel.property)
      ).size
      const totalAvailableParams = this.toolParams.length
      return uniqueSelectedParamsCount < totalAvailableParams
    },
    availableToolParamOptions() {
      // Фильтрация toolParamOptions, чтобы показывать только те, которые еще не выбраны
      return this.toolParamOptions.filter(
        (option) => !this.selectedParams.includes(option)
      )
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
        ? `Редактировать инструмент ID: ${this.tool.id}`
        : 'Добавить новый инструмент'
    },
  },
  watch: {
    toolId: {
      immediate: true,
      async handler(editingToolId) {
        if (editingToolId != null) {
          await this.fetchToolById(editingToolId)
          this.updateToolModel()
        }
      },
    },
  },
  async created() {
    this.updateAvailableToolParamOptions() // Вызываем при инициализации
    try {
      const fioData = await issueToolApi.getDetailFio()
      this.fioOptions = this.prepareFioOptions(fioData)
    } catch (error) {
      console.error('Ошибка при загрузке данных ФИО:', error)
    }

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

    // Добавьте этот метод в объект methods вашего компонента
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
        delete newProperty[0]

        // Обновляем значение выбранного параметра
        newProperty[selectedParam.id] = this.toolModel.property[0] || ''

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
    addParameterValuePair() {
      // Проверяем, существует ли уже параметр с временным ID 0 в selectedParams
      if (!this.selectedParams.includes('0')) {
        const newToolParam = { id: 0, info: null }
        this.toolParams.push(newToolParam)

        // Обновляем toolModel.property для добавления нового параметра с временным значением
        this.toolModel.property[newToolParam.id] = null

        // Обновляем selectedParams, чтобы включить новый временный параметр
        this.updateSelectedParams()
      }
    },

    updateAvailableToolParamOptions() {
      // Обновляем список доступных параметров на основе выбранных параметров
      this.availableToolParamOptions = this.toolParamOptions.filter(
        (option) => !this.selectedParams.includes(option.info)
      )
    },

    updateToolModel() {
      if (this.tool) this.toolModel = JSON.parse(JSON.stringify(this.tool))
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
      const { id } = this.toolModel
      if (id != null) {
        const response = await editorToolApi.deleteTool(id)
        if (response.success === 'OK') this.$emit('changes-saved')
      }
    },
    onCancel() {
      this.$emit('canceled')
    },
    async onSave() {
      const toolDataToSend = {
        ...this.toolModel,
        parent_id: this.parentCatalog.id,
      }
      try {
        let response
        if (this.toolId) {
          response = await editorToolApi.updateTool(this.toolId, toolDataToSend)
        } else {
          response = await editorToolApi.addTool(toolDataToSend)
        }
        if (response.success === 'OK') this.$emit('changes-saved')
      } catch (error) {
        console.error(
          'Ошибка при сохранении:',
          error.response ? error.response.data : error
        )
      }
    },
  },
}
</script>
