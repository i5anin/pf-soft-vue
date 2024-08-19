<template>
  <Modal :title="popupTitle" width-default="1550px">
    <template #content>
      <v-container>
        <v-table hover>
          <thead>
            <tr>
              <th />
              <th>Дата</th>
              <th>Комментарий</th>
              <th>Было</th>
              <th>Стало</th>
              <th>Изменение</th>
              <th>Выдал/Внёс</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in movements" :key="item.id">
              <td class="gray">{{ index + 1 }}</td>
              <td>{{ formatDate(item.datetime_log) }}</td>
              <td>{{ item.message }}</td>
              <td style="color: grey">{{ item.old_amount }}</td>
              <td style="color: grey">{{ item.new_amount }}</td>
              <td>
                <v-icon v-if="item.change > 0" small color="green" class="pr-3">
                  mdi-arrow-up
                </v-icon>
                <v-icon v-if="item.change < 0" small color="red" class="pr-3">
                  mdi-arrow-down
                </v-icon>
                <span v-if="item.change !== 0">{{ item.change }}</span>
              </td>
              <td>{{ item.user_login || 'Неопределен' }}</td>
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
import { defineComponent, computed, ref, onMounted } from 'vue'
import Modal from '@/modules/tools/shared/components/Modal.vue'
import { useEditorToolStore } from '../../piniaStore'
import { format, parseISO } from 'date-fns'

export default defineComponent({
  name: 'FillingModal',
  components: { Modal },
  props: {
    persistent: { type: Boolean, default: false },
    toolId: { type: Number, default: null },
  },
  emits: ['canceled', 'changes-saved'],
  setup(props) {
    const editorToolStore = useEditorToolStore()

    const snackbar = ref({
      show: false,
      color: 'error',
      text: '',
    })

    const movements = computed(() => editorToolStore.movements)

    const popupTitle = computed(() => {
      const tool = editorToolStore.getTool
      return tool?.id != null
        ? `Движение инструмента на складе: ${tool.name} (ID: ${tool.id})`
        : 'Движение инструмента'
    })

    onMounted(async () => {
      if (props.toolId) {
        await editorToolStore.fetchMovementHistory(props.toolId)
      }
    })

    const formatDate = (date) => {
      return format(parseISO(date), 'dd.MM.yy HH:mm:ss')
    }

    const showErrorSnackbar = (message) => {
      snackbar.value.text = message
      snackbar.value.color = 'error'
      snackbar.value.show = true
    }

    const onCancel = () => {
      this.$emit('close')
    }

    return {
      snackbar,
      movements,
      popupTitle,
      formatDate,
      showErrorSnackbar,
      onCancel,
    }
  },
})
</script>
