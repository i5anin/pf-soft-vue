<template>
  <!-- Интеграция хлебных крошек -->
  <!-- <div class="breadcrumbs">-->
  <div>
    <span v-for="(item, index) in tree" :key="index">
      <span :class="getBreadcrumbClass(index)" @click="goTo(index)">
        {{ item.label }}
        <span v-if="item.available !== 0"> ({{ item.available }}) </span>
      </span>
      <span v-if="index < tree.length - 1"> &nbsp;&nbsp;/&nbsp;&nbsp; </span>
    </span>
  </div>

  <!-- Отображение списка элементов -->
  <div v-if="currentItem && currentItem.nodes">
    <v-list-item
      v-for="item in currentItem.nodes"
      :key="item.id"
      class="align-center"
      @click="selectItem(item)"
    >
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

export default {
  name: 'CatalogBreadcrumbs',
  props: {
    tree: {
      type: Array,
      default: () => [],
    },
    currentItem: {
      type: Object,
      default: () => null,
    },
  },
  emits: ['go-to', 'item-selected'],
  computed: {
    appColor,
  },
  methods: {
    getBreadcrumbClass(index) {
      return {
        'breadcrumbs-item': index < this.tree.length - 1,
        'breadcrumbs-item-final': index === this.tree.length - 1,
      }
    },
    goTo(index) {
      this.$emit('go-to', index)
    },
    async selectItem(item) {
      this.$emit('item-selected', item)
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
