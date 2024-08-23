<template>
  <v-card>
    <v-tabs v-model="tab">
      <v-tab v-for="item in tabs" :key="item.name" :value="item.name">
        <v-icon size="large" :color="appColor" class="mr-2">
          {{ item.ico }}
        </v-icon>
        {{ item.name }}
      </v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab">
        <v-window-item
          v-for="item in tabs"
          :key="`window-item-${item.name}`"
          :value="item.name"
        >
          <component
            :is="item.component"
            :key="`component-${item.name}-${tab}`"
          />
          <!--          :type="item.type"-->
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script>
import tabs from '../config/configTabs'
import { authApi } from '@/api/login'
import { appColor } from '@/utils/colorUtils'

export default {
  data() {
    return { tab: null, tabs: [] }
  },

  computed: {
    appColor,
  },
  watch: {
    tab() {
      // Обновление URL в адресной строке при смене вкладки
      let current_tab = this.tabs.find((el) => el.name === this.tab)
      window.location.hash = current_tab.url
    },
  },
  mounted() {
    // Проверка текущей вкладки по URL в адресной строке
    let current_tab = this.tabs.find((el) => el.url === window.location.hash)
    if (current_tab !== undefined) this.tab = current_tab.name

    // Добавляем запрос на проверку доступов
    this.checkAccess()
  },
  methods: {
    async checkAccess() {
      try {
        const response = await authApi.checkLogin()
        if (response.status === 'ok') {
          // Фильтрация вкладок на основе роли пользователя
          this.tabs = tabs.filter((tab) => tab.access.includes(response.role))
          if (this.tabs.length > 0) {
            this.tab = this.tabs[0].name // Установка активной вкладки на первую доступную
          }
        } else {
          console.error('Ошибка доступа:', response.message)
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error.message)
      }
    },

    async submit() {
      if (!this.formValid) return
      try {
        const response = await authApi.login({
          login: this.login,
          password: this.password,
        })
        if (response.status === 'ok') {
          localStorage.setItem('token', response.token)
          this.$router.push('/')
        } else {
          this.showError = true
          this.errorMessage = 'Неправильный логин или пароль'
        }
      } catch (error) {
        this.showError = true
        this.errorMessage = error.message
        console.error('Ошибка входа:', error)
      }
    },
  },
}
</script>
