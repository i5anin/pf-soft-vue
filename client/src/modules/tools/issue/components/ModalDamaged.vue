<template>
  <!--  <form @submit.prevent='onSubmit'>-->
  <Modal :title="popupTitle">
    <template #content>
      <v-container>
        <v-row>
          <v-col>
            <div>
              <v-chip size="large" class="mb-3" color="red">
                {{ toolTitle }}
              </v-chip>
              <v-checkbox v-model="noCnc" label="Без станка" />
            </div>
            <v-combobox
              v-model="selectedCnc"
              :items="cncList"
              label="Выберите станок"
              item-title="cnc_name"
              item-value="cnc_code"
              :rules="[
                (v) => !!v || 'Выберите станок',
                (v) => !noCnc || 'Выберите станок', // Проверка только если noCnc == false
              ]"
              required
              single-line="false"
              :disabled="noCnc"
            />
            <v-text-field
              v-model.number="damagedQuantity"
              label="Количество"
              type="number"
              min="1"
              :rules="[
                (v) => !!v || 'Заполните поле',
                (v) => v > 0 || 'Количество должно быть больше 0',
              ]"
              required
            />
            <v-combobox
              v-model="selectedFio"
              :items="fioOptions"
              item-title="text"
              item-value="value"
              label="ФИО"
              :rules="[(v) => !!v || 'Выберите ФИО']"
              return-object="false"
              single-line="false"
            />
            <!-- @update:model-value="handleSelectionChange"-->
            <v-textarea
              v-model="comment"
              class="comment-field"
              label="Комментарий"
              rows="3"
              :rules="[(v) => !!v || 'Заполните поле']"
              required
            />
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
        Сохранить
      </v-btn>
    </template>
  </Modal>
</template>

<script>
import Modal from '@/modules/tools/shared/components/Modal.vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { issueToolApi } from '@/modules/tools/issue/api/issue'

export default {
  name: 'IssueModal',
  components: { Modal },
  props: {
    toolId: { type: Number, default: null },
    toolTitle: { type: String, default: '' },
  },
  emits: ['canceled', 'changes-saved'],
  data: () => ({
    damagedQuantity: 1,
    comment: null,
    selectedCnc: null,
    cncList: [],
    originalData: [],
    idMapping: {},
    isModalOpen: true,
    selectedFio: null,
    fioOptions: [],
    selectedData: { name: null, description: null, no: null, type: null },
    localParentId: null,
    selectedParams: [],
    toolParams: [],
    confirmDeleteDialog: false,
    typeSelected: false,
    selectedType: '',
    operationMapping: {},

    options: {
      idNameDescription: [],
      numberType: [],
    },
    noCnc: false, // Добавлено свойство для галочки "Без станка"
  }),
  computed: {
    ...mapGetters('IssueToolStore', ['nameOptions']),
    ...mapState('IssueToolStore', ['parentCatalog']),
    currentFolderName() {
      return this.toolId === null ? this.idParent.label : this.tool.folder_name
    },

    popupTitle() {
      return this.toolId != null
        ? `Инструмент поврежден ID: ${this.toolId}`
        : 'Ошибка нет ID'
    },
  },
  watch: {
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
    try {
      const cncData = await issueToolApi.fetchCncList()
      this.cncList = cncData ? [...cncData] : []
      if (cncData && Array.isArray(cncData)) {
        this.cncList = cncData
      } else {
        console.error('Ошибка при получении списка станков:', cncData)
      }
      // Если toolId не задан, устанавливаем начальные данные для инструмента
      if (this.toolId == null) {
        this.setTool({
          id: null,
          name: null,
          property: {},
        })
      } else {
        // Если toolId задан, запрашиваем данные об инструменте
        await this.fetchToolById(this.toolId)
        if (this.tool.property === null) this.tool.property = {}
      }
    } catch (error) {
      console.error('Ошибка в created:', error)
    }
  },

  methods: {
    ...mapMutations('IssueToolStore', ['setTool']),
    ...mapActions('IssueToolStore', ['fetchToolsByFilter', 'fetchToolById']),

    prepareFioOptions(fioData) {
      return fioData.map((item) => ({
        text: item.fio,
        value: item.id,
      }))
    },
    onCancel() {
      this.$emit('canceled')
    },
    async onSave() {
      try {
        const damagedToolData = {
          id_tool: this.toolId,
          id_user: this.selectedFio.value,
          cnc_code: this.noCnc ? null : this.selectedCnc.cnc_code, // Отправляем null, если галочка установлена
          comment: this.comment,
          quantity: this.damagedQuantity,
        }

        // Отправка данных о поврежденном инструменте
        const response =
          await issueToolApi.addToolHistoryDamaged(damagedToolData)
        if (response.success === 'OK') {
          this.$emit('changes-saved')
        } else {
          console.error(
            'Ошибка при сохранении данных о поврежденном инструменте: ',
            response
          )
        }
      } catch (error) {
        console.error(
          'Ошибка при отправке данных о поврежденном инструменте: ',
          error
        )
      }
    },
  },
}
</script>
