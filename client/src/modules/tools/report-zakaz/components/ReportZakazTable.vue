<!--ReportZakazTable.vue-->
<template>
  <zakaz-tool-modal
    v-if='openDialog'
    :persistent='true'
    :tool-id='editingToolId'
    @canceled='onClosePopup'
  />
  <v-table hover dense>
    <thead>
    <tr>
      <th
        v-for='header in toolTableHeaders'
        :key='header.key'
        class='text-left'
        :width='header.width'
      >
        {{ header.title }}
      </th>
    </tr>
    </thead>
    <tbody>
    <tr
      v-for='(item, index) in items'
      :key='index'
      @click="$emit('row-click', item)"
    >
      <td style='text-align: center' class='grey'>{{ index + 1 }}</td>
      <td>
        {{ item.name }}
        <v-chip
          v-if='item.group_id'
          size='x-small'
          :color='getColorForGroup(item.group_id)'
          :title="'Группа ' + item.group_id"
        >
          <span v-if='item.group_standard' style='color: yellow'> ★ </span>
          G{{ item.group_id }}
        </v-chip>
      </td>
      <td>
        <template v-if='item.norma >= item.sklad'>
          {{
            groupPath.includes('Пластины') && item.zakaz !== 0
              ? getRoundedCount(item.zakaz)
              : item.zakaz
          }}
        </template>
        <template
          v-if="
              item.norma >= item.sklad &&
              groupPath.includes('Пластины') &&
              item.zakaz !== 0 &&
              item.zakaz !== getRoundedCount(item.zakaz)
            "
        >
          <span class='grey'> ({{ item.zakaz }})</span>
        </template>
      </td>
      <td class='grey'>
        {{ item.group_sklad ? `*${item.group_sklad}` : item.sklad }}
      </td>
      <td class='grey'>
        <span v-if='item.norma_green'>{{ item.norma_green }} | </span>
        {{ item.norma }}
        <span v-if='item.norma_red'> | {{ item.norma_red }}</span>
      </td>
      <td style='text-align: center'>
        <v-chip
          :model-value='item.missing_percent'
          height='35'
          :color='getHexColor(item.status_color)'
        >
          {{ item.missing_percent }}%
        </v-chip>
      </td>
      <td style='text-align: center'>
        <v-btn size='small' icon='mdi mdi-history' @click='openToolHistory(item.id)' />
      </td>
    </tr>
    </tbody>
  </v-table>
</template>

<script>
import ZakazToolModal from '@/modules/tools/view/components/Modal.vue'
import { getColorForGroup, getHexColor } from '@/utils/colorUtils'

export default {
  components: { ZakazToolModal },
  emits: ['row-click'], // Объявляем, что компонент испускает событие 'row-click'
  data() {
    return {
      editingToolId: null,
      openDialog: false,
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
  methods: {
    getHexColor,
    getColorForGroup,
    onClosePopup() {
      this.openDialog = false
    },
    getRoundedCount(count) {
      if (count < 10) return 10
      return count % 10 < 5
        ? Math.floor(count / 10) * 10
        : Math.ceil(count / 10) * 10
    },
    openToolHistory(toolId) {
      // При клике на кнопку "История" сохраняем ID инструмента
      // и открываем модальное окно
      this.editingToolId = toolId
      this.openDialog = true
    },
  },
}
</script>
