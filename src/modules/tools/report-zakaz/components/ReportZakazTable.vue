<!--ReportZakazTable.vue-->
<template>
  <v-table hover dense>
    <thead>
      <tr>
        <th
          v-for="header in toolTableHeaders"
          :key="header.key"
          class="text-left"
          :width="header.width"
        >
          {{ header.title }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(item, index) in items"
        :key="index"
        @click="$emit('row-click', item)"
      >
        <td style="text-align: center" class="grey">{{ index + 1 }}</td>
        <td>
          {{ item.name }}
          <v-chip
            v-if="item.group_id"
            size="x-small"
            :color="getColorForGroup(item.group_id)"
            :title="'Группа ' + item.group_id"
          >
            <span v-if="item.group_standard" style="color: yellow"> ★ </span>
            G{{ item.group_id }}
          </v-chip>
        </td>
        <td>
          {{
            groupPath.includes('Пластины') && item.zakaz !== 0
              ? getRoundedCount(item.zakaz)
              : item.zakaz
          }}
          <template
            v-if="
              groupPath.includes('Пластины') &&
              item.zakaz !== 0 &&
              item.zakaz !== getRoundedCount(item.zakaz)
            "
          >
            <span class="grey"> ({{ item.zakaz }})</span>
          </template>
        </td>
        <td class="grey">
          {{ item.group_sklad ? `*${item.group_sklad}` : item.sklad }}
        </td>

        <td class="grey">
          <span v-if="item.norma_green">{{ item.norma_green }} | </span>
          {{ item.norma }}
          <span v-if="item.norma_red"> | {{ item.norma_red }}</span>
        </td>
        <td style="text-align: center">
          <v-progress-linear
            rounded
            :model-value="calcPercent(item)"
            height="25"
            :color="getToolColor(calcRatio(item))"
          >
            {{ calcPercent(item) }}%
          </v-progress-linear>
        </td>
        <td style="text-align: center">
          <v-btn
            size="small"
            icon="mdi mdi-history"
            :disabled="!item.hasMovementHistory"
          />
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script>
import Modal from './MovementModal.vue'

export default {
  components: { Modal },
  data() {
    return {
      hasMovementHistory: false,
      colors: { red: '#dc3545', yellow: '#ffc107', green: '#28a745' },
      toolTableHeaders: [
        { title: '№', key: 'index', width: '50px' },
        { title: 'Название', key: 'name' },
        { title: 'Заказ', key: 'zakaz', width: '150px' },
        { title: 'Склад', key: 'sklad', width: '150px' },
        { title: 'Норма', key: 'norma', width: '180px' },
        { title: 'Не хватает', key: 'not_enough', width: '150px' },
        { title: 'История', key: 'history', width: '15px' },
      ],
    }
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
    groupPath: {
      type: String,
      required: true,
    },
  },
  mounted() {
    this.$emit('lowest-color', this.getLowestGroupColor())
  },
  methods: {
    getLowestGroupColor() {
      let lowestRatio = 1
      this.items.forEach((tool) => {
        const ratio = this.calcRatio(tool)
        if (ratio < lowestRatio) lowestRatio = ratio
      })

      return this.getToolColor(lowestRatio)
    },
    getColorForGroup(index) {
      const hue = index * 137.508
      return `hsl(${hue % 360}, 50%, 50%)`
    },
    getRoundedCount(count) {
      if (count < 10) return 10
      return count % 10 < 5
        ? Math.floor(count / 10) * 10
        : Math.ceil(count / 10) * 10
    },
    calcPercent(item) {
      return (
        (1 -
          (item.group_sklad || item.sklad) / (item.norma_green || item.norma)) *
        100
      ).toFixed(0)
    },
    getToolColor(ratio) {
      if (ratio >= 0.8) {
        return this.colors.green
      } else if (ratio >= 0.4) {
        return this.colors.yellow
      } else {
        return this.colors.red
      }
    },
    getNormaForCalculation(tool) {
      let currentSklad = tool.group_sklad || tool.sklad

      if (tool.norma_green && currentSklad < tool.norma_green) {
        return tool.norma_green
      } else if (tool.norma_red && currentSklad < tool.norma_red) {
        return tool.norma_red
      } else {
        return tool.norma
      }
    },
    calcRatio(tool) {
      let sklad = tool.group_sklad || tool.sklad // Используйте последовательный метод для определения правильного значения склада.
      const norma = this.getNormaForCalculation(tool) // Определите правильное значение нормы
      if (norma === 0) return 0 // Предотвратите деление на ноль, гарантируя, что норма не равна нулю
      return sklad / norma // Рассчитайте соотношение
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
</style>
