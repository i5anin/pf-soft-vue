<template>
  <div>
    <v-list-item class="align-center" @click="selectItem">
      <div class="flex">
        <v-icon :color="appColor" icon="mdi-folder" class="icon" />
        <v-list-item-title :class="{ 'text-grey': item.totalElements === 0 }">
          {{ item.label }}
          <span v-if="item.elements !== 0" style="color: grey">
            <v-chip variant="text">
              {{ item.available }} / {{ item.elements }}
            </v-chip>
          </span>
        </v-list-item-title>
      </div>
    </v-list-item>
  </div>
</template>

<script>
import { appColor } from '@/utils/colorUtils'
import { useEditorToolStore } from '../../piniaStore'

export default {
  name: 'CatalogItem',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  setup() {
    const appColorStore = appColor()
    return { appColor: appColorStore.color } // Используйте appColor из стора
  },
  methods: {
    selectItem() {
      useEditorToolStore().selectItemInTree(this.item)
    },
  },
}
</script>

<style scoped>
.flex {
  display: flex;
}

.icon {
  margin-right: 10px;
}

.text-grey {
  color: grey;
}
</style>
