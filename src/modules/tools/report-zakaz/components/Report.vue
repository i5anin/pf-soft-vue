<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Название</th>
              <th class="text-left">Информация</th>
              <th class="text-left">На почту</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(report, index) in reports" :key="index">
              <td>{{ report.name }}</td>
              <td>{{ report.info }}</td>
              <td>
                <v-btn
                  color="primary"
                  :loading="report.loading"
                  :disabled="report.loading"
                  @click="sendEmailReport(report)"
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
  <ReportZakaz />
</template>
<script>
import { reportApi } from '../api/report'
import ReportZakaz from './ReportZakazFolder.vue'

export default {
  components: { ReportZakaz },
  data() {
    return {
      reports: [
        {
          name: 'Ревизия',
          info: 'весь инструмент',
          action: this.genRevisionInstrWeek,
        },
        {
          name: 'Отчет заявка на инструмент',
          info: 'каждый четверг',
          action: this.genZayavInstrWeek,
        },
        {
          name: 'Отчет по наладкам',
          info: '',
          action: this.genNalad,
        },
      ],
    }
  },

  methods: {
    async sendEmailReport(report) {
      report.loading = true // Начинаем анимацию загрузки и блокируем кнопку
      try {
        await report.action() // Вызываем соответствующую функцию генерации отчета
        // Дополнительные действия после успешной отправки, например, сообщение об успехе
      } catch (error) {
        console.error('Ошибка при отправке отчета:', error)
        // Обработка ошибки, например, сообщение об ошибке
      } finally {
        report.loading = false // Останавливаем анимацию и разблокируем кнопку
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
  },
}
</script>
