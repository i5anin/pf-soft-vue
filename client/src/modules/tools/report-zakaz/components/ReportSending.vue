<template>
  <v-container>
    <v-row v-if='hasAccess'>
      <v-col cols='12'>
        <v-table>
          <thead>
          <tr>
            <th class='text-left'>Название</th>
            <th class='text-left'>Информация</th>
            <th class='text-left'>На почту</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for='(report, index) in reports' :key='index'>
            <td>{{ report.name }}</td>
            <td>{{ report.info }}</td>
            <td>
              <v-btn
                :color='appColor()'
                :loading='report.loading'
                :disabled='report.loading'
                @click='sendEmailReport(report)'
              >
                Email
              </v-btn>
            </td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
  <ReportZakaz @row-click='openToolHistoryModal' />
</template>

<script>
import { reportApi } from '../api/report'
import ReportZakaz from './ReportZakazFolder.vue'
import { authApi } from '@/api/login'
import { appColor } from '@/utils/colorUtils'

export default {
  components: { ReportZakaz },
  data() {
    return {
      reports: [
        {
          name: '⭐ Заявка на инструмент',
          info: 'каждый четверг',
          action: this.genZayavInstrWeek,
        },
        {
          name: 'Ревизия',
          info: 'весь инструмент',
          action: this.genRevisionInstrWeek,
        },
        {
          name: 'По наладкам',
          info: 'Дополнительно',
          action: this.genNalad,
        },
      ],
      hasAccess: false,
      selectedToolId: null, // Добавьте свойство для хранения ID выбранного инструмента
    }
  },
  mounted() {
    this.checkLogin()
  },
  methods: {
    appColor,
    async sendEmailReport(report) {
      report.loading = true
      try {
        await report.action()
      } catch (error) {
        console.error('Ошибка при отправке отчета:', error)
      } finally {
        report.loading = false
      }
    },
    async genNalad() {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found in local storage.')
        return
      }
      try {
        await reportApi.genNalad(token)
      } catch (error) {
        console.error('Error while generating report:', error)
      }
    },
    async genZayavInstrWeek() {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found in local storage.')
        return
      }
      try {
        await reportApi.genZayavInstr(token)
      } catch (error) {
        console.error('Error while generating report:', error)
      }
    },
    async genRevisionInstrWeek() {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found in local storage.')
        return
      }
      try {
        await reportApi.genRevisionInstr(token)
      } catch (error) {
        console.error('Error while generating report:', error)
      }
    },
    async checkLogin() {
      const token = localStorage.getItem('token')
      if (!token) {
        this.hasAccess = false
        return
      }
      try {
        const response = await authApi.checkLogin(token)
        if (response.status === 'ok') {
          this.userRole = response.role
          this.hasAccess =
            this.userRole === 'Editor' || this.userRole === 'Admin'
        } else {
          this.hasAccess = false
        }
      } catch (error) {
        console.error('Ошибка при проверке логина:', error)
        this.hasAccess = false
      }
    },
    openToolHistoryModal(tool) {
      // Здесь вы можете открыть модальное окно и передать tool.id в него
      this.selectedToolId = tool.id
      // Например: this.$refs.yourModal.openModal(tool.id);
    },
  },
}
</script>
