<template>
  <div>
    <span v-for="(item, index) in getTree" :key="index">
      <span :class="getBreadcrumbClass(index)" @click="goTo(index)">
        {{ item.label }}
        <span v-if="item.available !== 0"> ({{ item.available }}) </span>
      </span>
      <span v-if="index < getTree.length - 1">   /   </span>
    </span>
  </div>
</template>

<script>
import { useEditorToolStore } from '../../piniaStore'
import { appColor } from '@/utils/colorUtils'

export default {
  name: 'CatalogBreadcrumbs',
  emits: ['go-to', 'item-selected'],
  data() {
    return {
      editorToolStore: useEditorToolStore(),
    }
  },
  computed: {
    appColor,
    getTree() {
      return this.editorToolStore.getTree
    },
  },
  methods: {
    getBreadcrumbClass(index) {
      return {
        'breadcrumbs-item': index < this.getTree.length - 1,
        'breadcrumbs-item-final': index === this.getTree.length - 1,
      }
    },
    goTo(index) {
      this.editorToolStore.goToInTree(index)
    },
    selectItem(item) {
      this.editorToolStore.selectItemInTree(item)
    },
  },
}
</script>

<style scoped>
/* Стили для хлебных крошек */
.breadcrumbs-item-final {
  color: grey;
}

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
