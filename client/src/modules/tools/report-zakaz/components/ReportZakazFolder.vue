<template>
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
          <v-icon
            :color='getHexColor(group.color_folder)'
            :icon="group.color_folder === 'green' ? 'mdi-folder' : 'mdi-folder-alert'"
            start
            :title="group.color_folder !== 'green' ? 'Есть позиции с низким запасом' : ''"
          />
        </template>
        {{ group.path }}
      </v-chip>
      <v-chip color='while'>{{ group.tools.length }}</v-chip>
      <div v-if='visibleGroups.includes(index)'>
        <group-zakaz-table
          :items='group.tools'
          :group-path='group.path'
        />
      </div>
    </div>
  </div>
</template>

<script>
import { reportApi } from '../api/report'
import GroupZakazTable from './ReportZakazTable.vue'
import { getHexColor } from '@/utils/colorUtils'

export default {
  components: { GroupZakazTable },
  data() {
    return {
      color_folder: '',
      toolGroups: [],
      visibleGroups: [],
      editingToolId: null,
      openDialog: false,
      isAllVisible: false,
    }
  },
  mounted() {
    this.fetchZakazData()
  },
  computed: {
    totalToolCount() {
      return this.toolGroups.reduce(
        (total, group) => total + group.tools.length,
        0,
      )
    },
  },
  methods: {

    async fetchZakazData() {
      try {
        const data = await reportApi.getZakaz()
        this.toolGroups = data.map((group) => ({
          ...group,
        }))
      } catch (error) {
        console.error('Ошибка при получении данных: ', error)
      }
    },

    toggleVisibility(index) {
      const visibleIndex = this.visibleGroups.indexOf(index);
      if (visibleIndex > -1) {
        this.visibleGroups.splice(visibleIndex, 1);
      } else {
        this.visibleGroups.push(index);
      }
    },
    toggleAllVisibility() {
      this.isAllVisible = !this.isAllVisible
      this.visibleGroups = this.isAllVisible
        ? [...Array(this.toolGroups.length).keys()]
        : []
    },
    getHexColor
  },
}
</script>

<style>
.tool-group + .tool-group {
  margin-top: 10px;
}
</style>
