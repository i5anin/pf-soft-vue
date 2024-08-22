<template>
  <Modal :title="popupTitle" width-default="650px">
    <template #content>
      <v-container>
        <v-row>
          <v-col>
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="currentItem.label"
                  label="Папка"
                  variant="solo"
                  density="compact"
                  required
                  type="Text"
                  :disabled="true"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  variant="solo"
                  density="compact"
                  v-model="tempParentId"
                  label="ID папки"
                  required
                  type="Number"
                  :rules="parentIdRules"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6" class="pl-10">
                <v-checkbox
                  v-model="toolModel.group_standard"
                  label="Эталон группы"
                  color="yellow"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="toolModel.group_id"
                  label="ID группы"
                  variant="solo"
                  density="compact"
                  required
                  type="Number"
                />
              </v-col>
            </v-row>
            <!--левый столбец -->
            <v-col cols="11" class="pa-1">
              <div class="d-flex">
                <v-combobox
                  v-model="toolModel.name"
                  variant="outlined"
                  label="Маркировка"
                  :items="toolNameOptions"
                  item-text="text"
                  item-value="value"
                  required
                  :rules="typeRules"
                />
                <div class="pl-10">
                  <v-btn
                    icon="mdi mdi-information-slab-circle-outline"
                    @click="showMovementModal = true"
                    :disabled="!mov_history"
                  />
                </div>
                <ToolMovementModal
                  v-if="showMovementModal"
                  :tool-id="toolId"
                  @close="showMovementModal = false"
                />
              </div>
            </v-col>
            <h2 class="text-h6">Характеристики:</h2>
            <div v-for="(param, index) in selectedParamsInfo" :key="param.id">
              <v-container>
                <v-row>
                  <v-col cols="6" class="pa-1">
                    <v-select
                      v-model="param.label"
                      variant="solo-filled"
                      density="compact"
                      :items="availableToolParamOptions"
                      label="Параметр"
                      single-line
                      solo
                      @update:model-value="(value) => selectParam(value, index)"
                    />
                  </v-col>
                  <v-col cols="5" class="pa-1">
                    <v-combobox
                      v-model="toolModel.property[param.id]"
                      density="compact"
                      :items="toolParamValues[param.id]"
                      label="Значение"
                      variant="outlined"
                      clearable
                      single-line
                      solo
                    />
                  </v-col>

                  <v-col cols="1">
                    <v-btn
                      class="delete-icon"
                      size="x-small"
                      icon
                      @click="removeParameter(param.id)"
                    >
                      <span>
                        <v-icon>mdi-delete</v-icon>
                      </span>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </div>
            <v-row justify="center">
              <v-col cols="12" class="text-center mb-4">
                <v-btn
                  v-show="isAddButtonVisible"
                  color="primary"
                  @click="addParameterValuePair"
                >
                  Добавить
                </v-btn>
              </v-col>
            </v-row>

            <v-divider class="my-1" />
            <v-row>
              <v-col cols="3">
                <v-text-field
                  :disabled="toolModel.group_id && !toolModel.group_standard"
                  v-model="toolModel.norma_green"
                  type="number"
                  color="green"
                  label="Норма макс"
                  required
                >
                  <template v-slot:append-inner>
                    <v-icon color="green">mdi-alert-box</v-icon>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  :disabled="toolModel.group_id && !toolModel.group_standard"
                  v-model="toolModel.norma"
                  type="number"
                  color="yellow"
                  label="Норма"
                  required
                >
                  <template v-slot:append-inner>
                    <v-icon color="yellow">mdi-alert-box</v-icon>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  :disabled="toolModel.group_id && !toolModel.group_standard"
                  v-model="toolModel.norma_red"
                  type="number"
                  color="red"
                  color-icon="red"
                  label="Норма мин"
                  required
                >
                  <template v-slot:append-inner>
                    <v-icon color="red">mdi-alert-box</v-icon>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  append-inner-icon="mdi-package"
                  v-model="toolModel.sklad"
                  type="number"
                  label="Склад"
                  required
                />
              </v-col>
            </v-row>
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
        prepend-icon="mdi-check"
        class="text-none text-subtitle-1 pl-3"
        color="green"
        size="large"
        variant="flat"
        @click="onSave"
      >
        Сохранить
      </v-btn>
    </template>
  </Modal>
  <!-- v-snackbar для отображения сообщений об ошибке -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" bottom right>
    {{ snackbar.text }}
    <v-btn color="white" text @click="snackbar.show = false">Закрыть</v-btn>
  </v-snackbar>
</template>

<script>
import ToolMovementModal from './MovementModal.vue'
import Modal from '@/modules/tools/shared/components/Modal.vue'
import { getToolParams } from '@/api'
import { editorToolApi } from '../../api/editor'
import { useEditorToolStore } from '@/modules/tools/editor/piniaStore'

export default {
  name: 'FillingModal',
  components: { Modal, ToolMovementModal },
  props: {
    persistent: { type: Boolean, default: false },
    toolId: { type: Number, default: null },
  },
  emits: ['canceled', 'changes-saved'],
  data() {
    return {
      mov_history: false,
      showMovementModal: false,
      tempParentId: null,
      snackbar: {
        show: false,
        color: 'error',
        text: '',
      },
      toolModel: {
        name: null,
        property: {},
        group_id: null,
        group_standard: null,
        sklad: null,
        norma: null,
        norma_green: null,
        norma_red: null,
      },
      toolNameOptions: [],
      toolParamValues: {},
      selectedParams: [],
      toolParams: [],
      parentIdRules: [
        (v) => !!v || 'ID папки обязательно',
        (v) => v > 1 || 'ID папки должен быть больше 1',
        (v) => v !== '' || 'ID папки не должен быть пустым',
      ],
      typeRules: [
        (v) => !!v || 'Поле обязательно для заполнения',
        (v) => (v && v.length >= 3) || 'Минимальная длина: 3 символа',
      ],
      editorToolStore: useEditorToolStore(),
    }
  },
  computed: {
    currentItem() {
      return this.editorToolStore.getCurrentItem
    },
    availableToolParamOptions() {
      return this.allToolParamLabels.filter(
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
      return this.toolModel.id != null
        ? `Редактировать инструмент ID: ${this.toolModel.id}`
        : 'Добавить новый инструмент'
    },
    parentCatalog() {
      return this.editorToolStore.parentCatalog
    },
  },
  watch: {
    toolId: {
      immediate: true,
      async handler(toolId) {
        if (toolId) {
          await this.loadExistingTool(toolId)
        } else {
          this.resetToolModel()
        }

        this.tempParentId = this.currentItem.id
        this.mov_history = this.toolModel.mov_history
      },
    },
  },
  async created() {
    await this.fetchToolData()
    await this.initializeToolModel()
  },
  methods: {
    async fetchToolData() {
      if (!this.currentItem) return
      await this.fetchToolParamsByParentId(this.currentItem.id)
      await this.fetchToolNamesByParentId(this.currentItem.id)
      try {
        const rawToolParams = await getToolParams()
        this.toolParams = [...rawToolParams]
        this.allToolParamLabels = rawToolParams.map((param) => param.label)
      } catch (error) {
        console.error('Ошибка при загрузке параметров инструмента:', error)
      }
    },
    async initializeToolModel() {
      if (this.toolId) {
        await this.loadExistingTool(this.toolId)
      } else {
        this.resetToolModel()
      }
    },
    async loadExistingTool(toolId) {
      try {
        await this.editorToolStore.fetchToolById(toolId)
        this.toolModel = JSON.parse(
          JSON.stringify(this.editorToolStore.getTool)
        )
        if (this.toolModel.property === null) {
          this.toolModel.property = {}
        }
        this.updateSelectedParams()
      } catch (error) {
        this.showErrorSnackbar('Инструмент не найден.')
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
        this.toolParamValues = paramsData.reduce((acc, item) => {
          acc[item.id] = item.values
          return acc
        }, {})
      } catch (error) {
        console.error('Ошибка при получении данных о параметрах:', error)
      }
    },
    removeParameter(id) {
      if (window.confirm('Вы уверены, что хотите удалить этот параметр?')) {
        delete this.toolModel.property[id]
        this.toolModel.property = { ...this.toolModel.property }
        this.updateSelectedParams()
      }
    },
    selectParam(paramInfo) {
      const selectedParam = this.toolParams.find((p) => p.label === paramInfo)
      if (selectedParam) {
        const newProperty = { ...this.toolModel.property }
        delete newProperty[-1]
        newProperty[selectedParam.id] = this.toolModel.property[-1] || ''
        this.toolModel.property = newProperty
        this.updateSelectedParams()
      }
    },
    updateSelectedParams() {
      this.selectedParams = Object.keys(this.toolModel.property)
        .map((id) => {
          const param = this.toolParams.find((param) => String(param.id) === id)
          return param ? param.label : null
        })
        .filter((label) => label !== null)
    },
    resetToolModel() {
      this.toolModel = {
        name: null,
        limit: null,
        sklad: null,
        norma: null,
        property: {},
        group_id: 0,
        group_standard: null,
      }
    },
    addParameterValuePair() {
      if (!this.selectedParams.includes('-1')) {
        const newToolParam = { id: -1, label: null }
        this.toolParams.push(newToolParam)
        this.toolModel.property[newToolParam.id] = null
        this.updateSelectedParams()
      }
    },
    confirmDelete() {
      if (window.confirm('Вы уверены, что хотите удалить этот инструмент?')) {
        this.onDelete()
      }
    },
    async onDelete() {
      try {
        const response = await editorToolApi.deleteTool(this.toolModel.id)
        if (response.success === 'OK') {
          this.$emit('changes-saved')
        }
      } catch (error) {
        console.error('Ошибка при удалении инструмента:', error)
        this.showErrorSnackbar('Инструмент используется в истории.')
      }
    },
    onCancel() {
      this.$emit('canceled')
    },
    async onSave() {
      const token = localStorage.getItem('token')
      const toolDataToSend = {
        ...this.toolModel,
        parent_id: this.tempParentId,
        editToken: token,
      }
      try {
        let response
        if (this.toolId) {
          response = await editorToolApi.updateTool(this.toolId, toolDataToSend)
        } else {
          response = await editorToolApi.addTool(toolDataToSend)
        }
        if (response.success === 'OK') {
          this.$emit('changes-saved')
        }
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
<style scoped>
.delete-icon:hover .v-icon {
  color: red;
}
</style>
