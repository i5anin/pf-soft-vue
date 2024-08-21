<template>
  <v-footer v-if="databaseInfo" class="container">
    <v-chip variant="plain" density="compact">
      Все права защищены © 2024
    </v-chip>
    <v-spacer />
    <v-chip
      :color="databaseInfo.dbName === 'BusinessForum' ? 'red' : 'green'"
      density="compact"
    >
      <template v-if="databaseInfo.dbName === 'BusinessForum'">
        <!--        <v-icon left icon="mdi-information" />-->
        Версия: {{ databaseInfo.databaseType }}
      </template>
      <template v-else>
        <v-icon left icon="mdi-database" />
        {{ databaseInfo.dbName }}
      </template>
    </v-chip>
  </v-footer>
</template>

<script>
import { getDatabaseInfo } from '@/api/getDatabaseInfo'

export default {
  name: 'AppFooter',
  data() {
    return {
      databaseInfo: null,
    }
  },
  computed: {
    isBuildDatabase() {
      return this.databaseInfo && this.databaseInfo.databaseType === 'build'
    },
  },
  async mounted() {
    try {
      this.databaseInfo = await getDatabaseInfo()
    } catch (error) {
      console.error('Failed to load database info:', error)
    }
  },
}
</script>

<style scoped lang="css">
.text-red {
  color: red;
}
</style>
