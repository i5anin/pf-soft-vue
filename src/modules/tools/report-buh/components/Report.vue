<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Название</th>
              <th class="text-left">Ближайшая дата</th>
              <!-- <th class="text-left">На почту</th>-->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(report, index) in reports" :key="index">
              <td>{{ report.name }}</td>
              <td>{{ report.info }}</td>
              <td>
                <!--                <v-btn color="primary" @click="report.action(report)">-->
                <!--                  Email-->
                <!--                </v-btn>-->
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
import ReportZakaz from './ReportBuhTable.vue'

export default {
  components: { ReportZakaz },
  data() {
    return {
      reports: [
        {
          name: 'Исключен сломанный',
          info: 'раз в неделю каждый ПТ в 12:00 (за неделю)',
        },
        {
          name: 'По завершению партии',
          info: 'отправлено на почту',
        },
        {
          name: 'Журнал поврежденного',
          info: 'раз в месяц каждый ПТ в 12:00 (за месяц)',
        },
      ],
    }
  },
}
</script>
