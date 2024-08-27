<template>
  <v-row
    v-for="(group, index) in groupedFilters"
    :key="`group-${index}`"
    cols="12"
    sm="6"
  >
    <v-col v-for="filter in group" :key="filter.key" cols="12" sm="3">
      <v-combobox
        density="compact"
        variant="solo"
        clearable
        :label="filter.label"
        :items="filter.values"
        :value="selectedValues[filter.key]"
        @update:model-value="
          (value) => updateFilterValue({ key: filter.key, value })
        "
      />
    </v-col>
  </v-row>
</template>

<script>
import { useEditorToolStore } from '@/store/editorToolStore'; // Импортируйте ваш store

export default {
  emits: ['filter-update'],
  // Удаляем props: filters
  data() {
    return {
      selectedValues: {},
      editorToolStore: useEditorToolStore(), // Создаем экземпляр store
    };
  },
  computed: {
    groupedFilters() {
      // Используем getter из стора
      return this.editorToolStore.getGroupedFilters;
    },
  },
  methods: {
    updateFilterValue({ key, value }) {
      this.selectedValues = {
        [key]: value,
      };
      this.$emit('filter-update', this.selectedValues);
    },
  },
};
</script>
