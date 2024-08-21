<template>
  <v-app class="custom-container">
    <v-app-bar app dark>
      <div class="text-h6 pl-5">
        <!-- <v-icon class="mr-2">mdi-folder</v-icon>-->
        {{ currentItem ? currentItem.label : 'Выдать' }}
      </div>
      <v-spacer />
      <v-btn icon @click="goBack">
        <v-icon icon="mdi-arrow-left" />
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container :fluid="true">
        <v-row>
          <v-col cols="12">
            <catalog-breadcrumbs
              v-bind="{ tree, currentItem }"
              @go-to="goTo"
              @item-selected="selectItem"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
  <TabMainTable
    v-if="isTableShown"
    v-bind="{
      namespace: 'IssueToolStore',
    }"
  />
</template>

<script>
import { toolTreeApi } from '@/modules/tools/tree/api/tree'
import { mapActions, mapMutations, mapGetters } from 'vuex'
import TabMainTable from './Table.vue'
import CatalogBreadcrumbs from '@/modules/tools/shared/components/CatalogBreadcrumbs.vue'

export default {
  name: 'IssueCatalog',
  components: { TabMainTable, CatalogBreadcrumbs },

  data() {
    return {
      fioOptions: [],
      selectedFio: null,
      operationMapping: {},
      options: {
        idNameDescription: [],
        numberType: [],
      },
      tree: [],
      currentItem: null,
      selectedItem: null,
      isEditing: false,
      editableLabel: '',
      toolModel: {
        name: null,
        property: {},
        selectedOperationId: null,
        typeIssue: null,
      },
    }
  },
  computed: {
    ...mapGetters('IssueToolStore', ['parentCatalog', 'cartItems']),
    isTableShown() {
      return this.parentCatalog.id !== 1
    },
  },
  watch: {
    currentItem: {
      handler(currentItem) {
        this.setParentCatalog({
          id: currentItem.id,
          label: currentItem.label,
        })
        this.fetchToolsByFilter()
      },
    },
  },

  async created() {
    const toolsTree = await toolTreeApi.getTree({ folderNotNull: true })
    if (toolsTree && toolsTree.length > 0) {
      this.currentItem = toolsTree[0]
      this.tree.push(this.currentItem)
    }
  },
  methods: {
    ...mapMutations('IssueToolStore', [
      'setSelectedOperationId',
      'setSelectedDetail',
      'setParentCatalog',
      'setSelectedOperationId',
      'setSelectedFio',
    ]),

    ...mapActions('IssueToolStore', ['fetchToolsByFilter']),

    async selectItem(item) {
      this.setParentCatalog({ id: item.id, label: item.label })
      this.currentItem = item
      if (!this.tree.includes(item)) this.tree.push(item)
    },
    goBack() {
      if (this.tree.length > 1) {
        this.tree.pop() // Удаляем последний элемент истории
        this.currentItem = this.tree[this.tree.length - 1] // Обновляем currentItem на предыдущий элемент
        this.setParentCatalog({
          id: this.currentItem.id,
          label: this.currentItem.label,
        })
      }
    },
    goTo(index) {
      this.currentItem = this.tree[index]
      this.setParentCatalog({
        id: this.currentItem.id,
        label: this.currentItem.label,
      })
      this.tree = this.tree.slice(0, index + 1)
      this.currentItem = this.tree[index]
    },
  },
}
</script>

<style>
/* Стили для хлебных крошек */
.breadcrumbs {
  margin-bottom: 8px;
}

.custom-container > div {
  min-height: 0 !important;
}
</style>
