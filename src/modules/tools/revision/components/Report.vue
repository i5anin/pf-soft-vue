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
                <v-btn color="primary" @click="report.action(report)"
                  >Email</v-btn
                >
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
  </v-container>
  <!--  <ReportZakaz></ReportZakaz>-->
</template>
<script>
import { reportApi } from '../api/report'
import ReportZakaz from './ReportRevision.vue'

export default {
  components: { ReportZakaz },
  data() {
    return {
      reports: [
        {
          name: 'Revision All',
          info: '',
          action: this.genBuchIssuedWeek,
        },
        {
          name: 'Revision Date',
          info: '',
          action: this.genBuchEndOp,
        },
      ],
    }
  },

  methods: {
    async genBuchIssuedWeek() {
      await reportApi.genBuchWeek()
    },
    async genBuchEndOp() {
      await reportApi.genBuchEndOp()
    },
    async genBuchMonth() {
      await reportApi.genBuchMonth()
    },
    async genZayavInstrWeek() {
      await reportApi.genZayavInstr()
    },
  },
}
</script>
