
**Вот улучшенный код с учетом Vue 3 Options API и некоторых принципов "Чистого кода":**

```vue
<template>
  <Modal :title="popupTitle" width-default="1550px">
    <template #content>
      <v-container>
        <v-table hover>
          <thead>
            <tr>
              <th />
              <th>Дата</th>
              <th>Комментарий</th>
              <th>Было</th>
              <th>Стало</th>
              <th>Изменение</th>
              <th>Автор</th>
            </tr>
          </thead>
          <tbody>
            <MovementRow 
              v-for="(movement, index) in movements" 
              :key="movement.id" 
              :movement="movement"
              :index="index" 
            />
          </tbody>
        </v-table>
      </v-container>
    </template>
    <template #action>
      <v-btn
        color="red darken-1"
        variant="text"
        class="text-none text-subtitle-1 ml-3"
        @click="$emit('close')" 
      >
        Закрыть
      </v-btn>
      <v-spacer />
    </template>
  </Modal>
</template>

<script>
import { defineComponent, computed, onMounted } from 'vue'
import Modal from '@/modules/tools/shared/components/Modal.vue'
import { useEditorToolStore } from '../../piniaStore'
import { format, parseISO } from 'date-fns'
import MovementRow from './MovementRow.vue'; 

export default defineComponent({
  name: 'FillingModal',
  components: { 
    Modal,
    MovementRow 
  },
  props: {
    toolId: { type: Number, default: null },
  },
  setup(props) {
    const editorToolStore = useEditorToolStore();

    const movements = computed(() => editorToolStore.movements);

    const popupTitle = computed(() => {
      const tool = editorToolStore.getTool;
      return tool?.id 
        ? `Движение инструмента на складе: ${tool.name} (ID: ${tool.id})`
        : 'Движение инструмента';
    });

    onMounted(async () => {
      if (props.toolId) {
        await editorToolStore.fetchMovementHistory(props.toolId);
      }
    });

    return {
      movements,
      popupTitle,
    };
  },
});
</script>
```

**Создайте компонент `MovementRow.vue`:**
```vue
<template>
  <tr>
    <td class="gray">{{ index + 1 }}</td>
    <td>{{ formattedDate }}</td>
    <td>{{ movement.message }}</td>
    <td style="color: grey">{{ movement.old_amount }}</td>
    <td style="color: grey">{{ movement.new_amount }}</td>
    <td>
      <ChangeIcon :change="movement.change" />
      <span v-if="movement.change !== 0">{{ movement.change }}</span>
    </td>
    <td>{{ movement.user_login || 'Неопределен' }}</td>
  </tr>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import ChangeIcon from './ChangeIcon.vue'; 

export default defineComponent({
  name: 'MovementRow',
  components: { ChangeIcon }, 
  props: {
    movement: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const formattedDate = computed(() => 
      format(parseISO(props.movement.datetime_log), 'dd.MM.yy HH:mm:ss')
    );

    return {
      formattedDate,
    };
  },
});
</script>
```

**Создайте компонент `ChangeIcon.vue`:**
```vue
<template>
  <v-icon v-if="change > 0" small color="green" class="pr-3">
    mdi-arrow-up
  </v-icon>
  <v-icon v-if="change < 0" small color="red" class="pr-3">
    mdi-arrow-down
  </v-icon>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ChangeIcon',
  props: {
    change: {
      type: Number,
      required: true,
    },
  },
});
</script>

```

**Рекомендации:**

- Разбивайте код на более мелкие, специализированные компоненты (как показано в примере с `MovementRow` и `ChangeIcon`).
- Используйте осмысленные имена переменных и функций.
- Избегайте дублирования кода.
- Следите за форматированием и отступами.
- Пишите unit-тесты, чтобы убедиться в правильности работы кода.

Помните, что "Чистый код" - это не набор строгих правил, а скорее набор принципов и рекомендаций, которые помогают писать более понятный, поддерживаемый и надежный код.
