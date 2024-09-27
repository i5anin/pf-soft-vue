<template>
  <div>
    <v-container>
      <v-img class='mx-auto my-6' max-width='100' src='@/assets/logo_min.png' />
      <h1 class='text-h4 text-center pb-6'>Авторизация</h1>
      <v-card
        v-if='!isAuthorized'
        class='mx-auto pa-12 pb-8'
        elevation='8'
        max-width='448'
        rounded='lg'
      >
        <v-form ref='form' v-model='formValid'>
          <div class='text-subtitle-1 text-medium-emphasis'>Логин</div>
          <v-text-field
            v-model='login'
            density='compact'
            placeholder='Login'
            prepend-inner-icon='mdi-key'
            variant='outlined'
            :rules='loginRules'
          />
          <div
            class='text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between'
          >
            Пароль
          </div>
          <v-text-field
            v-model='password'
            :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
            :type="visible ? 'text' : 'password'"
            density='compact'
            placeholder='Password'
            prepend-inner-icon='mdi-lock-outline'
            variant='outlined'
            :rules='passwordRules'
            @click:append-inner='toggleVisibility'
            @keyup='handleKeyUp'
          />
          <v-btn
            :disabled='!formValid'
            block
            class='mb-8'
            color='blue'
            size='large'
            variant='tonal'
            @click='submit'
          >Войти
          </v-btn
          >
          <v-alert
            v-if='showError'
            type='error'
            dismissible
            @click='showError = false'
          >
            {{ errorMessage }}
          </v-alert>
        </v-form>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import { axiosInstance } from '@/api/axiosConfig'
import { mapActions } from 'vuex'

export default {
  data: () => ({
    login: '',
    password: '',
    visible: false,
    isAuthorized: false,
    showError: false,
    errorMessage: '',
    formValid: false,
    loginRules: [(v) => !!v || 'Логин обязателен'],
    passwordRules: [(v) => !!v || 'Пароль обязателен'],
  }),
  created() {
    this.isAuthorized = !!localStorage.getItem('token')
  },
  methods: {
    ...mapActions('authStore', ['setAuthorization', 'setUserRole']),
    toggleVisibility() {
      this.visible = !this.visible
    },
    async submit() {
      console.log('submit')
      await this.$refs.form.validate()
      if (!this.formValid) return

      try {
        const response = await axiosInstance.post('/login', {
          login: this.login,
          password: this.password,
        })

        if (response.data.status === 'ok') {
          localStorage.setItem('token', response.data.token)
          this.$router.push('/') // Перенаправляем на главную страницу
        } else {
          this.showError = true
          this.errorMessage = 'Неправильный логин или пароль'
        }
      } catch (error) {
        this.showError = true
        this.errorMessage = 'Ошибка авторизации'
        console.error('Login error:', error)
      }
    },
    handleKeyUp(event) {
      if (event.which === 13) {
        this.submit();
      }
    }
  },
}
</script>
