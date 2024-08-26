<template>
  <div>
    <span v-for="(item, index) in getTree" :key="index">
      <span :class="getBreadcrumbClass(index)" @click="goTo(index)">
        {{ item.label }}
        <span v-if="item.available !== 0"> ({{ item.available }}) </span>
      </span>
      <span v-if="index < getTree.length - 1">   /   </span>
    </span>

    <!--    <div v-if="getCurrentItem && getCurrentItem.nodes">-->
    <!--      <v-list-item-->
    <!--        v-for="item in getCurrentItem.nodes"-->
    <!--        :key="item.id"-->
    <!--        class="align-center"-->
    <!--        @click="selectItem(item)"-->
    <!--      >-->
    <!--        <div class="flex">-->
    <!--          <v-icon :color="appColor" icon="mdi-folder" class="icon" />-->
    <!--          <v-list-item-title :class="{ 'text-grey': item.totalElements === 0 }">-->
    <!--            {{ item.label }}-->
    <!--            <span v-if="item.elements !== 0" style="color: grey">-->
    <!--              <v-chip variant="text">-->
    <!--                {{ item.available }} / {{ item.elements }}-->
    <!--              </v-chip>-->
    <!--            </span>-->
    <!--          </v-list-item-title>-->
    <!--        </div>-->
    <!--      </v-list-item>-->
    <!--    </div>-->
  </div>
</template>

<script>
import { useEditorToolStore } from '../../store'
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
