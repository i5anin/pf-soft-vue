<template>
  <header>
    <ModalCart
      v-if="isModalOpen"
      :persistent="true"
      @canceled="closeModal"
      @changes-saved="onSaveChanges"
    />

    <v-navigation-drawer
      class="header"
      location="left"
      width="330"
      permanent
      :rail="isRail"
    >
      <v-list>
        <v-list-item prepend-avatar="@/assets/logoWhite.svg" title="СОФТ 2.0" />
      </v-list>
      <v-divider />
      <v-list>
        <v-list-item
          prepend-avatar="@/assets/avatar.png"
          :title="userInfo.user"
          :subtitle="appTitle"
        />
      </v-list>
      <v-divider />
      <v-list-item v-if="isHovered">
        <v-list-item-title>Участки</v-list-item-title>
      </v-list-item>
      <!-- Участки -->
      <menu-list
        :menu-items="plotsMenuItemsComputed"
        :group-states="groupStates"
      />
    </v-navigation-drawer>

    <v-app-bar :color="appColor" sticky prominent dark>
      <!-- Левая кнопка -->
      <v-app-bar-nav-icon variant="text" @click.stop="isRail = !isRail" />

      <!-- Название -->
      <v-toolbar-title>{{ appTitle }}</v-toolbar-title>

      <v-spacer />
      <!-- <div>openDialog: {{ openDialog }}, currentModal: {{ currentModal }}</div>-->
      <div v-if="cartItemsLength > 0" class="ma-5" @click="openCartModal">
        <v-btn icon>
          <v-icon>mdi-cart-outline</v-icon>
        </v-btn>
        <!--Позиций {{ cartItemsLength }}-->
        <div class="d-inline-flex align-center mr-2">Инструмент к выдаче</div>
        <v-chip color="red" variant="flat">
          {{ cartItemsTotalQuantity }}
        </v-chip>
      </div>

      <v-chip v-if="userInfo.user" class="ma-2" label dark>
        <template #prepend>
          <v-icon icon="mdi-account" start />
        </template>
        {{ userInfo.user }}
      </v-chip>
      <!-- Три кнопки справа -->
      <!--      <v-btn icon>-->
      <!--        <v-icon>mdi-magnify</v-icon>-->
      <!--      </v-btn>-->
      <!--      <v-btn icon>-->
      <!--        <v-icon>mdi-fullscreen</v-icon>-->
      <!--      </v-btn>-->
      <!--      <v-btn icon>-->
      <!--        <v-icon>mdi-moon-last-quarter</v-icon>-->
      <!--      </v-btn>-->
      <v-btn icon>
        <v-icon @click="logout">mdi-exit-to-app</v-icon>
      </v-btn>
    </v-app-bar>
  </header>
</template>

<script>
import { plotsMenuItems } from '@/main-app/data/menuItems'
import ModalCart from '@/modules/tools/issue/components/ModalCart.vue'
import MenuList from '@/main-app/SidebarMenuList.vue'
import { authApi } from '@/api/login'
import { mapActions, mapGetters, mapState } from 'vuex'

export default {
  name: 'AppHeader',
  components: { MenuList, ModalCart },
  data: () => ({
    isRail: true,
    isHovered: false,
    userInfo: {},
  }),
  computed: {
    ...mapState('IssueToolStore', ['isModalOpen']),
    ...mapGetters({ cartItems: 'IssueToolStore/cartItems' }),
    cartItemsLength() {
      return this.cartItems ? this.cartItems.length : 0
    },

    cartItemsTotalQuantity() {
      return this.cartItems
        ? this.cartItems.reduce((total, item) => total + item.quantity, 0)
        : 0
    },
    appTitle() {
      return import.meta.env.VITE_APP_TITLE || 'LOGO'
    },
    appColor() {
      return import.meta.env.VITE_NODE_ENV === 'build'
        ? import.meta.env.VITE_BUILD_COLOR
        : import.meta.env.VITE_DEV_COLOR
    },
    plotsMenuItemsComputed() {
      return this.filterForHohlov(plotsMenuItems)
    },
    groupStates() {
      return []
    },
  },
  async created() {
    this.userInfo = await authApi.checkLogin()
  },

  methods: {
    ...mapActions('IssueToolStore', ['openModal', 'closeModal']),

    operationId() {
      return this.selectedOperationId
    },

    openCartModal() {
      this.openModal()
    },
    onClosePopup() {
      this.openDialog = false
      this.currentModal = null
    },
    onSaveChanges() {
      this.onClosePopup()
    },
    filterForHohlov(items) {
      return items
        .filter((item) => item.access && item.access.includes('hohlov'))
        .map((item) => {
          // Задаем иконку по умолчанию, если не задана
          if (!item.icon) item.icon = 'mdi-circle-outline'
          // Проверяем подпункты
          if (item.items) {
            item.items = item.items.map((subItem) => {
              if (!subItem.icon) subItem.icon = 'mdi-circle-outline'
              return subItem
            })
          }
          return item
        })
    },
    logout() {
      localStorage.removeItem('token') // Если вы используете Vuex для отслеживания статуса аутентификации
      this.$router.push('/Login') // Перенаправление на страницу входа
    },
  },
}
</script>

<style scoped lang="css">
::v-deep .v-navigation-drawer__content::-webkit-scrollbar {
  width: 0;
}
</style>
