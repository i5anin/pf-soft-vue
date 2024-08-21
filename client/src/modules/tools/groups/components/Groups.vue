<template>
  <!--  {{ this.toolGroups }}-->
  <groups-tool-modal
    v-if="openDialog"
    :persistent="true"
    :tool-id="editingToolId"
    @canceled="onClosePopup"
    @changes-saved="modalSaved"
  />
  <div>
    <div class="d-flex justify-end">
      <v-btn variant="text" @click="toggleAllVisibility">
        {{ isAllVisible ? 'Свернуть все' : 'Развернуть все' }}
      </v-btn>
    </div>
    <div
      v-for="(group, groupIndex) in toolGroups"
      :key="groupIndex"
      class="tool-group"
    >
      <v-chip
        v-if="group[0].group_id"
        :color="getColorForGroup(group[0].group_id)"
        :title="'Группа ' + group[0].group_id"
      >
        G{{ group[0].group_id }}
      </v-chip>
      <v-chip variant="text" size="large" @click="toggleVisibility(groupIndex)">
        {{ group[0].name }}

        <span v-if="!group[0].group_standard" class="pl-4 pr-2">
          (Эталон не установлен)
        </span>
        <span class="grey pl-4 pr-2"> Склад группы: </span>
        {{ totalForEachGroup.totalsForEachGroup[group[0].group_id] }}

        <span class="grey pl-4 pr-2">Норма:</span>
        {{ group[0].norma }}

        <div
          v-if="
            group[0].norma -
              totalForEachGroup.totalsForEachGroup[group[0].group_id] >
            0
          "
        >
          <span class="red pl-4 pr-2"> Не хватает: </span>
          {{
            group[0].norma -
            totalForEachGroup.totalsForEachGroup[group[0].group_id]
          }}
        </div>
      </v-chip>
      <div v-if="visibleGroups.includes(groupIndex)">
        <v-table hover dense>
          <thead>
            <tr>
              <th class="text-left mw25">#</th>
              <th class="text-left mw200">Инструмент</th>
              <th class="text-left mw200">Расположение</th>
              <th class="text-left mw25">Склад</th>
              <th class="text-left mw25">Норма</th>
              <!--              <th class="text-left">Характеристики</th>-->
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(tool, toolIndex) in group"
              :key="toolIndex"
              @click="editTool(tool.id)"
            >
              <td class="grey">{{ toolIndex + 1 }}</td>
              <td>
                {{ tool.name }}
                <span v-if="tool.group_standard" style="color: yellow">★</span>
              </td>
              <td>{{ tool.path }}</td>
              <td>{{ tool.sklad }}</td>
              <td>{{ toolIndex === 0 ? tool.norma : '' }}</td>
              <!--              <td>{{ tool.property }}</td>-->
            </tr>
          </tbody>
        </v-table>
      </div>
    </div>
  </div>
</template>

<script>
import { toolGroupsApi } from '../api/groups' // Импортируем API
import GroupsToolModal from './Modal.vue'

export default {
  components: { GroupsToolModal },
  data() {
    return {
      toolGroups: [],
      visibleGroups: [],
      colors: ['red', 'green', 'blue', 'orange', 'purple', 'cyan'],
      editingToolId: null,
      openDialog: false,
      isAllVisible: false, // Состояние - все списки развернуты или нет
    }
  },
  mounted() {
    this.fetchGroupsData()
  },
  computed: {
    totalForEachGroup() {
      let totalSum = 0
      const totals = Object.keys(this.toolGroups).reduce((acc, groupId) => {
        // Используем Object.values чтобы получить массив инструментов каждой группы
        const groupTotal = this.toolGroups[groupId].reduce(
          (sum, tool) => sum + tool.sklad,
          0
        )
        // Складываем общую сумму по всем группам
        totalSum += groupTotal
        // Записываем сумму для каждой группы
        acc[groupId] = groupTotal
        return acc
      }, {})

      // Возвращаем объект с суммами по каждой группе и общей суммой
      return { totalsForEachGroup: totals, totalSum }
    },
  },
  methods: {
    modalSaved() {
      this.openDialog = false
      this.fetchGroupsData()
    },
    editTool(toolId) {
      this.editingToolId = toolId
      this.openDialog = true
    },
    onClosePopup() {
      this.openDialog = false
    },
    getColorForGroup(index) {
      const hue = index * 137.508 // используем золотое сечение
      return `hsl(${hue % 360}, 50%, 50%)`
    },
    async fetchGroupsData() {
      try {
        this.toolGroups = await toolGroupsApi.getToolGroups()
      } catch (error) {
        console.error('Ошибка при получении данных: ', error)
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
        this.visibleGroups = Object.keys(this.toolGroups) // Получаем ключи (group_id)
      } else {
        this.visibleGroups = []
      }
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

.mw25 {
  min-width: 25px;
}

.mw300 {
  min-width: 300px;
}

.mw200 {
  min-width: 200px;
}

.red {
  color: #f44336;
}

.grey {
  color: grey;
}
</style>
