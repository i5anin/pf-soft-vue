<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex">
          <h2 class="text-h5">Параметры Инструмента</h2>
          <v-spacer />
          <v-btn color="primary" @click="startAdding">
            <v-icon left>mdi-playlist-plus</v-icon>
            Добавить параметр
          </v-btn>
        </div>
        <v-dialog v-model="showDialog" persistent max-width="600px">
          <v-card>
            <v-card-title>{{ dialogTitle }}</v-card-title>
            <v-card-text>
              <v-text-field v-model="paramInfo" label="Название" required />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="blue darken-1" text @click="showDialog = false">
                Отмена
              </v-btn>
              <v-btn color="blue darken-1" text @click="saveParam">
                Сохранить
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-table hover>
          <thead>
            <tr>
              <th class="text-left">№</th>
              <th class="text-left">Название</th>
              <!--<th class="text-left">ID</th>-->
              <th class="text-left">Порядок</th>
              <th class="text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(param, index) in toolParams" :key="param.id">
              <td>{{ index + 1 }}</td>
              <td>{{ param.label }}</td>
              <!--<td>{{ param.id }}</td>-->
              <td>
                <v-btn
                  icon
                  :disabled="index === 0"
                  @click="moveToolParam(param.id, 'moveUp')"
                >
                  <v-icon>mdi-chevron-up</v-icon>
                </v-btn>
                <v-btn
                  icon
                  :disabled="index === toolParams.length - 1"
                  @click="moveToolParam(param.id, 'moveDown')"
                >
                  <v-icon>mdi-chevron-down</v-icon>
                </v-btn>
              </td>
              <td>
                <v-btn icon @click="startEditing(param)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon @click="deleteParam(param)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { getToolParams } from '@/api'
// import { normSpaces } from '@/modules/shared/normSpaces'
import { toolParamApi } from '@/modules/tools/params/api/params'

export default {
  data() {
    return {
      toolParams: [],
      showDialog: false,
      dialogTitle: '',
      paramInfo: '',
      editingParam: null,
    }
  },
  mounted() {
    this.getData()
  },
  methods: {
    async getData() {
      try {
        this.toolParams = await getToolParams()
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    },
    startAdding() {
      this.dialogTitle = 'Новый параметр'
      this.paramInfo = ''
      this.editingParam = null
      this.showDialog = true
    },
    startEditing(param) {
      this.dialogTitle = 'Редактировать название параметра'
      this.paramInfo = param.label
      this.editingParam = param
      this.showDialog = true
    },
    async saveParam() {
      if (this.paramInfo) {
        // Обработка ввода и нормализация данных
        const normalizedParamInfo = this.paramInfo

        // Проверка на дублирование параметров
        if (
          this.toolParams.some(
            (param) =>
              param.label.toLowerCase() === normalizedParamInfo.toLowerCase() &&
              param.id !== this.editingParam?.id
          )
        ) {
          alert('Такой параметр уже существует')
          return
        }

        try {
          if (this.editingParam) {
            // Обновление существующего параметра
            const updatedParam = { label: normalizedParamInfo }
            const result = await toolParamApi.updateToolParam(
              this.editingParam.id,
              updatedParam
            )

            if (result) {
              // Обновление данных в массиве toolParams
              this.toolParams = this.toolParams.map((param) =>
                param.id === this.editingParam.id
                  ? { ...param, label: normalizedParamInfo }
                  : param
              )
            }
          } else {
            // Добавление нового параметра
            const newParam = await toolParamApi.addToolParam({
              label: normalizedParamInfo,
            })
            if (newParam && newParam.id) {
              this.toolParams.push(newParam)
            } else {
              throw new Error('Failed to retrieve new param data')
            }
          }
        } catch (error) {
          console.error('Error saving tool parameter:', error)
        }

        // Сброс данных формы
        this.paramInfo = ''
        this.showDialog = false
        this.editingParam = null
      } else {
        alert('Пожалуйста, введите информацию для инструмента')
      }
    },
    async deleteParam(param) {
      const confirmDelete = confirm(
        `Вы уверены, что хотите удалить параметр: ${param.label}?`
      )
      if (confirmDelete) {
        try {
          await toolParamApi.deleteToolParam(param.id)
          const index = this.toolParams.indexOf(param)
          if (index > -1) {
            this.toolParams.splice(index, 1)
          }
        } catch (error) {
          console.error('Error deleting tool parameter:', error)
        }
      }
    },
    async moveToolParam(paramId, direction) {
      try {
        await toolParamApi.moveToolParam(paramId, direction)

        // Обновляем данные в массиве toolParams, чтобы отразить изменение порядка
        if (direction === 'moveUp') {
          const paramIndex = this.toolParams.findIndex(
            (param) => param.id === paramId
          )
          if (paramIndex > 0) {
            // Перемещаем элемент вверх
            ;[this.toolParams[paramIndex], this.toolParams[paramIndex - 1]] = [
              this.toolParams[paramIndex - 1],
              this.toolParams[paramIndex],
            ]
          }
        } else if (direction === 'moveDown') {
          const paramIndex = this.toolParams.findIndex(
            (param) => param.id === paramId
          )
          if (paramIndex < this.toolParams.length - 1) {
            // Перемещаем элемент вниз
            ;[this.toolParams[paramIndex], this.toolParams[paramIndex + 1]] = [
              this.toolParams[paramIndex + 1],
              this.toolParams[paramIndex],
            ]
          }
        }

        // Можно добавить дополнительную логику для обновления порядка параметров
        // в таблице toolParams, например, обновить поле param_order
        // ...
      } catch (error) {
        console.error('Error moving tool parameter:', error)
      }
    },
  },
}
</script>
