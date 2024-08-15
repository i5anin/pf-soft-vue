<template>
  <v-app class="custom-container">
    <folder />
    <v-main>
      <v-container :fluid="true">
        <v-row>
          <v-col cols="12">
            <div>
              <span v-for="(item, index) in breadcrumbs" :key="index">
                <span :class="getBreadcrumbClass(index)" @click="goTo(index)">
                  {{ item.label }}
                  <span v-if="item.available !== 0">
                    ({{ item.available }})
                  </span>
                </span>
                <span v-if="index < breadcrumbs.length - 1">   /   </span>
              </span>
            </div>
            <div v-if="currentItems.length">
              <v-list-item
                v-for="item in currentItems"
                :key="item.id"
                class="align-center"
                @click="selectItem(item)"
              >
                <div class="flex">
                  <v-icon :color="appColor" icon="mdi-folder" class="icon" />
                  <v-list-item-title
                    :class="{ 'text-grey': item.totalElements === 0 }"
                  >
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
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Folder from './Folder.vue'
import { useEditorToolStore } from '@/modules/tools/editor/piniaStore'

export default {
  name: 'Catalog',
  components: { Folder },
  data() {
    return {
      editorToolStore: useEditorToolStore(),
    }
  },
  async created() {
    try {
      await this.editorToolStore.fetchTree()
    } catch (error) {
      console.error('Ошибка при получении дерева инструментов:', error)
      // Обработка ошибки, например, отображение сообщения пользователю
    }
  },
  computed: {
    appColor() {
      return import.meta.env.VITE_NODE_ENV === 'build'
        ? import.meta.env.VITE_BUILD_COLOR
        : import.meta.env.VITE_DEV_COLOR
    },
    breadcrumbs() {
      return this.editorToolStore.tree.map((item, index) => ({
        label: item.label,
        available: item.available,
        index,
      }))
    },
    currentItems() {
      return this.editorToolStore.currentItem?.nodes || []
    },
  },
  methods: {
    getBreadcrumbClass(index) {
      return {
        'breadcrumbs-item': index < this.breadcrumbs.length - 1,
        'breadcrumbs-item-final': index === this.breadcrumbs.length - 1,
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
