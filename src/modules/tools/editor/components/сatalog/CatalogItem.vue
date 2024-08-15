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
import { useEditorToolStore } from '@/modules/tools/editor/piniaStore'

export default {
  name: 'CatalogItem',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  computed: {
    appColor() {
      return import.meta.env.VITE_NODE_ENV === 'build'
        ? import.meta.env.VITE_BUILD_COLOR
        : import.meta.env.VITE_DEV_COLOR
    },
  },
  methods: {
    selectItem() {
      const editorToolStore = useEditorToolStore()
      editorToolStore.selectItemInTree(this.item)
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
