<template>
  selectedValues = {{ selectedValues }}
  <v-row
    v-for="(group, index) in filters"
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
export default {
  emits: ['filter-update'],
  props: {
    filters: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      selectedValues: {}, // Храним выбранные значения в компоненте
    };
  },
  methods: {
    updateFilterValue({ key, value }) {
      this.selectedValues = {
        ...this.selectedValues,
        [key]: value,
      };
      this.$emit('filter-update', this.selectedValues);
    },
  },
};
</script>
