<template>
  <zakaz-tool-modal
    v-if='openDialog'
    :persistent='true'
    :tool-id='editingToolId'
    @canceled='onClosePopup'
  />
  <div>
    <div class='d-flex justify-end'>
      <v-btn variant='text' @click='toggleAllVisibility'>
        {{ isAllVisible ? 'Свернуть все' : 'Развернуть все' }}
        ({{ totalToolCount }})
      </v-btn>
    </div>
    <div v-for='(group, index) in toolGroups' :key='index' class='tool-group'>
      <v-chip variant='text' size='large' @click='toggleVisibility(index)'>
        <template #prepend>
          <v-icon v-if='!checkTools(group)' color='green' icon='mdi-folder' start />
          <v-icon
            v-if='checkTools(group)'
            icon='mdi-folder-alert'
            start
            :color='getLowestGroupColor(group)'
            title='Есть позиции с низким запасом'
          />
        </template>
        {{ group.path }}
      </v-chip>
      <v-chip color='while'>{{ group.tools.length }}</v-chip>
      <div v-if='visibleGroups.includes(index)'>
        <v-table hover dense>
          <thead>
          <tr>
            <th class='text-left mw50'>#</th>
            <th class='text-left mw300'>Название</th>
            <th class='text-left mw50'>Заказ</th>
            <th class='text-left mw50'>Склад</th>
            <!-- <th class='text-left mw50'>Склад группы</th>-->
            <th class='text-left mw50'>Норма</th>
            <th class='text-left mw50'>Не хватает</th>
            <th class='text-left mw50'>Коэф исп</th>
          </tr>
          </thead>
          <tbody>
          <tr
            v-for='(tool, toolIndex) in group.tools'
            :key='toolIndex'
            @click='openToolModal(tool.id_tool)'
          >
            <td class='grey'>{{ toolIndex + 1 }}</td>
            <td>
              {{ tool.name }}
              <v-chip
                v-if='tool.group_id'
                size='x-small'
                :color='getColorForGroup(tool.group_id)'
                :title="'Группа ' + tool.group_id"
              >
              <span v-if='tool.group_standard' style='color: yellow'>
                ★
              </span> G{{ tool.group_id }}
              </v-chip>
            </td>
            <td>
              {{
                group.path.includes('Пластины') && tool.zakaz !== 0
                  ? getRoundedCount(tool.zakaz)
                  : tool.zakaz
              }}
              <template
                v-if="
                    group.path.includes('Пластины') &&
                    tool.zakaz !== 0 &&
                    tool.zakaz !== getRoundedCount(tool.zakaz)
                  "
              >
                <v-chip variant='plain'>({{ tool.zakaz }})</v-chip>
              </template>
            </td>
            <td>
              <v-chip variant='plain'>{{ tool.sklad }}</v-chip>
            </td>

            <td  class='grey'>
              {{ tool.norma_green }}
              <span v-if='tool.norma_green'> | </span>
              {{ tool.norma }}
              <span v-if='tool.norma_green'> | </span>
              {{ tool.norma_red }}
            </td>
            <td>
<!--              {{tool.sklad / tool.norma}}-->
              <v-chip v-if='!tool.norma_red || !tool.norma_green' :color='getToolColor(tool.group_sklad / tool.norma)'>
                <span v-if='tool.group_sklad'>{{ calcPercent(tool.group_sklad, tool.norma) }} %</span>
                <span v-else>{{ calcPercent(tool.sklad, tool.norma) }} %</span>
              </v-chip>
              <v-chip v-if='tool.norma_red || tool.norma_green'
                      :color='getToolColorLight(tool.sklad,tool.norma, tool.norma_green, tool.norma_red)'>
                <span v-if='tool.group_sklad'>{{ calcPercent(tool.group_sklad, tool.norma_green) }} %</span>
                <span v-else>{{ calcPercent(tool.sklad, tool.norma_green) }} %</span>
              </v-chip>
            </td>
            <td>
              <v-chip v-if='tool.taken_coefficient'
                      :variant='getChipVariant(tool.taken_coefficient)'
                      :color='getChipColor(tool.taken_coefficient)'>
                {{ tool.taken_coefficient.toFixed(4) }}
              </v-chip>
            </td>
          </tr>
          </tbody>
        </v-table>
      </div>
    </div>
  </div>
</template>

<script>
import { reportApi } from '../api/report' // Импортируем API
import ZakazToolModal from '@/modules/tools/view/components/Modal.vue'

export default {
  components: { ZakazToolModal },
  data() {
    return {
      toolGroups: [],
      visibleGroups: [],
      colors: ['red', 'orange', 'yellow', 'green'], // Цвета для иерархии
      editingToolId: null,
      openDialog: false,
      isAllVisible: false, // Состояние - все списки развернуты или нет
      totalToolCount: 0, // Общее количество инструментов
      colorMap: { // Массив цветов с номерами
        green: '#28a745', // Зеленый
        yellow: '#ffc107', // Желтый
        red: '#dc3545', // Красный
      },
    }
  },
  mounted() {
    this.fetchZakazData()
  },
  computed: {
    totalToolCount() {
      let count = 0
      this.toolGroups.forEach((group) => {
        count += group.tools.length
      })
      return count
    },
  },
  methods: {
    getLowestGroupColor(group) {
      let lowestRatio = 1 // Начальное значение для максимального запаса
      let worstColor = this.colorMap.green // Начинаем с наилучшего цвета
      group.tools.forEach((tool) => {
        const ratio = tool.sklad / this.getNormaForCalculation(tool) // Используем getNormaForCalculation
        if (ratio < lowestRatio) lowestRatio = ratio
        const toolColor = this.getToolColor(tool.sklad, tool.norma, tool.norma_green, tool.norma_red)
        // Если цвет инструмента "хуже" текущего worstColor, обновляем worstColor
        if (toolColor === this.colorMap.red || (toolColor === this.colorMap.yellow && worstColor === this.colorMap.green)) {
          worstColor = toolColor
        }
      })
      return this.getToolColor(lowestRatio) // Получаем цвет на основе самого низкого запаса
    },

    getChipVariant(coefficient) {
      if (coefficient > 2) {
        return 'filled'
      } else if (coefficient > 1) {
        return 'filled'
      } else if (coefficient > 0.5) {
        return 'text'
      } else if (coefficient >= 0) {
        return 'plain'
      } else {
        return 'default'
      }
    },
    getChipColor(coefficient) {
      if (coefficient > 2) {
        return 'red'
      } else if (coefficient > 1) {
        return 'secondary'
      } else if (coefficient > 0.5) {
        return 'primary' // или любой другой цвет по вашему выбору
      } else {
        return '' // без цвета
      }
    },
    onClosePopup() {
      this.openDialog = false
    },
    openToolModal(toolId) {
      this.editingToolId = toolId
      this.openDialog = true
    },
    getColorForGroup(index) {
      const hue = index * 137.508 // используем золотое сечение
      return `hsl(${hue % 360}, 50%, 50%)`
    },
    getRoundedCount(count) {
      if (count < 10) return 10
      return count % 10 < 5
        ? Math.floor(count / 10) * 10
        : Math.ceil(count / 10) * 10
    },
    calcPercent(sklad, norma) {
      return ((1 - (sklad) / norma) * 100).toFixed(0)
    },

    async fetchZakazData() {
      try {
        this.toolGroups = await reportApi.getZakaz() // Убедитесь, что это правильный путь к данным в вашем API
      } catch (error) {
        console.error('Ошибка при получении данных: ', error)
        // Здесь можно добавить обработку ошибок, например, отображение сообщения пользователю
      }
    },
    toggleVisibility(index) {
      const visibleIndex = this.visibleGroups.indexOf(index)
      if (visibleIndex === -1) {
        this.visibleGroups.push(index)
      } else {
        this.visibleGroups.splice(visibleIndex, 1)
      }
    },
    toggleAllVisibility() {
      this.isAllVisible = !this.isAllVisible
      if (this.isAllVisible) {
        this.visibleGroups = [...Array(this.toolGroups.length).keys()]
      } else {
        this.visibleGroups = []
      }
    },


    getToolColorLight(sklad, norma, normaGreen, normaRed) {
      if (norma <= sklad && sklad < normaGreen) {
        return this.colorMap.green // Зеленый - хороший запас
      } else if (normaRed <= sklad && sklad < norma) {
        return this.colorMap.yellow // Желтый - умеренный запас
      } else if (norma < normaRed) {
        return this.colorMap.green  // Красный - критический запас
      }
      return '' // Если никакие условия не совпадают, возвращает пустую строку
    },

    getToolColor(ratio) {
      if (ratio >= 0.8) {
        return this.colorMap.green // Зеленый - хороший запас
      } else if (ratio >= 0.4) {
        return this.colorMap.yellow // Желтый - умеренный запас
      } else {
        return this.colorMap.red // Красный - критический запас
      }
    },

    getNormaForCalculation(tool) {
      // Используем norma_green или norma_red только для расчета нехватки
      if (tool.norma_green && tool.sklad < tool.norma_green) {
        return tool.norma_green
      } else if (tool.norma_red && tool.sklad < tool.norma_red) {
        return tool.norma_red
      } else {
        return tool.norma // В остальных случаях используем tool.norma
      }
    },

    checkTools(group) {
      return group.tools.some((tool) => {
        const ratio = tool.sklad / this.getNormaForCalculation(tool)
        return (1 - ratio) * 100 >= 20
      })
    },
  },
}
</script>

<style>
.grey {
  color: grey;
}

.tool-group + .tool-group {
  margin-top: 10px;
}

.mw50 {
  min-width: 50px;
}

.mw300 {
  min-width: 300px;
}

.red {
  color: #f44336;
}
</style>
