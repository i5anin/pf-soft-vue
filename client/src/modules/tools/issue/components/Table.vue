<template>
  <v-snackbar
    v-model="snackbarVisible"
    :timeout="8000"
    bottom
    right
    color="blue-grey"
  >
    {{ snackbarText }}
  </v-snackbar>
  <v-container>
    <tool-filter
      :filter-params-list="filterParamsList"
      :filters="filters"
      @filter-update="onParamsFilterUpdate"
    />
    <v-btn color="primary" class="mb-2" @click="refreshData">
      <v-icon left>mdi-refresh</v-icon>
      Обновить
    </v-btn>
    <ModalDamaged
      v-if="openDialog && currentModal === 'damaged'"
      :key="'modal-damaged'"
      :persistent="true"
      :tool-id="editingToolId"
      :tool-title="editingToolName"
      @canceled="onClosePopup"
      @changes-saved="onSaveChanges"
      @close="openDialog = false"
    />
    <v-data-table-server
      v-if="isDataLoaded"
      no-data-text="Нет данных"
      items-per-page-text="Пункты на странице:"
      loading-text="Загрузка данных"
      :headers="toolTableHeaders"
      :items="formattedTools"
      :items-length="toolsTotalCount"
      :items-per-page="filters.itemsPerPage"
      :page="filters.currentPage"
      :loading="isLoading"
      :items-per-page-options="[15, 50, 100, 300]"
      density="compact"
      class="elevation-1 scrollable-table"
      hover
      fixed-header
      width
      @update:page="onChangePage"
      @update:items-per-page="onUpdateItemsPerPage"
    >
      <template #item.index="{ index }">
        <td class="index">{{ index + 1 }}</td>
      </template>
      <!--name-->
      <template #item.name="{ item }">
        <td :class="colorClassGrey(item)" style="white-space: nowrap">
          <v-chip size="large" variant="text"> {{ item.name }}</v-chip>
        </td>
      </template>
      <template #item.sklad="{ item }" #item.norma="{ item }">
        <td :class="colorClassRed(item)" style="white-space: nowrap">
          <v-chip size="large" color="primary" variant="flat">
            {{ item.sklad }}
          </v-chip>
          <span v-if="item.norma" class="grey"> / {{ item.norma }} </span>
        </td>
      </template>
      <template #item.norma="{ item }">
        <td style="white-space: nowrap">{{ item.norma }}</td>
      </template>
      <template #item.zakaz="{ item }">
        <td style="white-space: nowrap">{{ calculateOrder(item) }}</td>
      </template>
      <template #item.damaged="{ item }">
        <v-btn color="red" @click="(event) => onDamagedTool(event, item)">
          <v-icon icon="mdi-image-broken-variant" />
        </v-btn>
      </template>
      <template #item.cart="{ item }">
        <v-btn color="yellow" @click="addToolToCart(item.id, 1)">
          <v-icon icon="mdi-cart-arrow-down" />
        </v-btn>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script>
import ModalDamaged from './ModalDamaged.vue'
import ToolFilter from './ToolFilter.vue'

import { mapActions, mapGetters, mapMutations } from 'vuex'

export default {
  components: {
    ToolFilter,
    ModalDamaged,
  },
  props: {
    namespace: {
      type: String,
      default: 'tool',
    },
  },
  emits: ['changes-saved', 'canceled', 'page-changed', 'page-limit-changed'],
  data() {
    return {
      snackbarVisible: false,
      snackbarText: '',
      openDialog: false,
      isDataLoaded: false,
      editingToolId: null,
      editingToolName: null,
      toolTableHeaders: [], //заголовки таблиц инструментов
      filterParamsList: [],
      currentModal: null,
    }
  },
  computed: {
    ...mapGetters('IssueToolStore', [
      'toolsTotalCount',
      'formattedTools',
      'dynamicFilters',
      'filters',
      'parentCatalog',
      'isLoading',
      'cartItems',
    ]),
  },

  watch: {
    'parentCatalog.id'(newId) {
      if (newId != null) {
        this.fetchToolsDynamicFilters()
      }
    },
    dynamicFilters: {
      immediate: true,
      handler(dynamicFilters) {
        this.toolTableHeaders = [
          { title: '№', key: 'index', sortable: false },
          { title: 'Маркировка', key: 'name', sortable: false },
          { title: '⭐Склад / Норма', key: 'sklad', sortable: false },
          // { title: 'Норма', key: 'norma', sortable: false },
          { title: 'Выдать', key: 'cart', sortable: false },
          { title: 'Поврежден', key: 'damaged', sortable: false },
          ...(dynamicFilters && dynamicFilters.length > 0
            ? dynamicFilters.map(({ label: title, key }) => ({
                title,
                key,
                sortable: false,
              }))
            : []),
          // { title: 'Заказ', key: 'zakaz', sortable: false },
          // { title: 'Лимит', key: 'limit', sortable: fals
          // { title: 'Выдать', key: 'issue', sortable: false },
        ]
      },
    },
  },

  async mounted() {
    await this.fetchToolsDynamicFilters()
    this.isDataLoaded = true
  },

  methods: {
    ...mapActions('IssueToolStore', [
      'fetchToolsDynamicFilters',
      'fetchToolsByFilter',
    ]),
    ...mapMutations('IssueToolStore', [
      'setCurrentPage',
      'setItemsPerPage',
      'setSelectedDynamicFilters',
    ]),
    async updateTableData() {
      await this.fetchToolsByFilter() // полагаем, что этот метод обновляет данные таблицы
    },
    refreshData() {
      this.fetchToolsByFilter() // Assuming this method fetches and refreshes the data
    },
    showSnackbar(message) {
      this.snackbarText = message
      this.snackbarVisible = true
    },
    showModal(type) {
      this.currentModalType = type
      this.isModalOpen = true
    },
    addToolToCart(toolId, quantityToAdd) {
      const tool = this.formattedTools.find((t) => t.id === toolId)
      if (!tool) {
        this.showSnackbar('Товар не найден.')
        return
      }

      const existingCartItem = this.cartItems.find(
        (item) => item.toolId === toolId
      )
      const totalQuantityInCart = existingCartItem
        ? existingCartItem.quantity + quantityToAdd
        : quantityToAdd

      if (totalQuantityInCart > tool.sklad) {
        this.showSnackbar(
          `Невозможно добавить. На складе доступно только ${tool.sklad}, в корзине уже ${
            existingCartItem ? existingCartItem.quantity : 0
          }.`
        )
        return
      }

      // Обновляем количество в корзине или добавляем новый элемент
      if (existingCartItem) {
        existingCartItem.quantity += quantityToAdd
      } else {
        this.cartItems.push({
          toolId: tool.id,
          quantity: quantityToAdd,
          name: tool.name,
          sklad: tool.sklad,
        })
      }

      this.showSnackbar(
        `${tool.name} добавлен в корзину. В корзине ${totalQuantityInCart}, на складе ${
          tool.sklad - totalQuantityInCart
        }.`
      )
    },
    onIssueTool(event, item) {
      event.stopPropagation()
      this.editingToolId = item.id
      this.currentModal = 'issue'
      this.openDialog = true
    },
    onDamagedTool(event, item) {
      event.stopPropagation()
      this.editingToolId = item.id
      this.editingToolName = item.name
      this.currentModal = 'damaged'
      this.openDialog = true
    },
    // Метод для обработки обновления параметров фильтра
    onParamsFilterUpdate({ key, value }) {
      this.setSelectedDynamicFilters({
        ...this.filters.selectedDynamicFilters,
        [key]: value,
      })
      this.fetchToolsByFilter()
    },
    async onChangePage(page) {
      this.setCurrentPage(page)
      await this.fetchToolsByFilter()
    },
    async onUpdateItemsPerPage(itemsPerPage) {
      this.setItemsPerPage(itemsPerPage)
      await this.fetchToolsByFilter()
    },

    colorClassGrey(item) {
      return { grey: !item.sklad || item.sklad === 0 }
    },
    colorClassRed(item) {
      return { red: !item.sklad || item.sklad === 0 }
    },
    calculateOrder(tool) {
      const order = tool.norma - tool.sklad
      return order < 0 ? '' : order
    },

    onClosePopup() {
      this.openDialog = false
    },
    onSaveChanges() {
      this.openDialog = false
      this.fetchToolsDynamicFilters()
      this.fetchToolsByFilter()
    },
  },
}
</script>

<style scoped>
.index {
  max-width: 40px !important;
  font-size: 0.9em;
  color: grey;
}

.grey {
  color: grey;
}

.red {
  color: red;
}

.scrollable-table {
  height: 74vh; /* Замените это значение на желаемую высоту */
  overflow-y: auto;
}
</style>
