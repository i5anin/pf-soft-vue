<!--ReportZakazFolder.vue-->
<template>
  <zakaz-tool-modal
    v-if="openDialog"
    :persistent="true"
    :tool-id="editingToolId"
    @canceled="onClosePopup"
  />
  <div>
    <div class="d-flex justify-end">
      <v-btn variant="text" @click="toggleAllVisibility">
        {{ isAllVisible ? 'Свернуть все' : 'Развернуть все' }}
        ({{ totalToolCount }})
      </v-btn>
    </div>
    <div v-for="(group, index) in toolGroups" :key="index" class="tool-group">
      <v-chip variant="text" size="large" @click="toggleVisibility(index)">
        <template #prepend>
          <v-icon v-if="!group.hasLowStock" color="green" icon="mdi-folder" start />
          <v-icon
            v-else
            icon="mdi-folder-alert"
            start
            :color="group.lowestColor"
            title="Есть позиции с низким запасом"
          />
        </template>
        {{ group.path }}
      </v-chip>
      <v-chip color="while">{{ group.tools.length }}</v-chip>
      <div v-if="visibleGroups.includes(index)">
        <group-zakaz-table
          :items="group.tools"
          :group-path="group.path"
          @lowest-color="updateGroupLowestColor(index, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { reportApi } from '../api/report'
import ZakazToolModal from '@/modules/tools/view/components/Modal.vue'
import GroupZakazTable from './ReportZakazTable.vue'

export default {
  components: { ZakazToolModal, GroupZakazTable },
  data() {
    return {
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
      return this.toolGroups.reduce((total, group) => total + group.tools.length, 0)
    },
  },
  methods: {
    onClosePopup() {
      this.openDialog = false
    },
    updateGroupLowestColor(index, color) {
      this.toolGroups[index].lowestColor = color
      // Update hasLowStock based on the new color
      this.toolGroups[index].hasLowStock = color !== '#28a745'
    },

    checkGroupForLowStock(tools) {
      return tools.some((tool) => {
        const ratio = this.calcRatio(tool)
        return (1 - ratio) * 100 >= 20
      })
    },

    async fetchZakazData() {
      try {
        this.toolGroups = await reportApi.getZakaz()
        // Calculate hasLowStock for each group immediately
        this.toolGroups = fetchedToolGroups.map((group) => ({
          ...group,
          hasLowStock: this.checkGroupForLowStock(group.tools),
          lowestColor: this.getLowestGroupColor(group.tools), // Calculate initial color
        }))
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
      this.visibleGroups = this.isAllVisible ? [...Array(this.toolGroups.length).keys()] : []
    },
  },
}
</script>

<style>
.tool-group + .tool-group {
  margin-top: 10px;
}
</style>
