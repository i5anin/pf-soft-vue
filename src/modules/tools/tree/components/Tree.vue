<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- Кнопка обновления -->
        <v-row justify="end">
          <v-col cols="auto">
            <v-btn variant="text" @click="refreshTreeData">
              <v-icon left>mdi-refresh</v-icon>
              Обновить
            </v-btn>
          </v-col>
        </v-row>

        <!-- Рекурсивное отображение дерева -->
        <v-list-item class="mt-4">
          <tree-node
            v-for="node in treeData"
            :key="node.id"
            :node="node"
            @refresh-node="refreshTreeData"
          />
        </v-list-item>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { toolTreeApi } from '@/modules/tools/tree/api/tree'
import TreeNode from './TreeNode.vue'

export default {
  name: 'TreeView',
  components: { TreeNode },
  data() {
    return {
      treeData: [], // Инициализация пустого массива для данных дерева
    }
  },
  async created() {
    await this.refreshTreeData()
  },
  methods: {
    async refreshTreeData() {
      try {
        const updatedTree = await toolTreeApi.getTree()
        if (updatedTree && updatedTree.length > 0) {
          // Предполагаем, что ты хочешь пропустить корневой узел с ID 1 и начать с его дочерних элементов
          const rootNode = updatedTree.find((node) => node.id === 1) // Находим корневой узел с ID 1
          this.treeData = rootNode && rootNode.nodes ? rootNode.nodes : [] // Устанавливаем дочерние элементы корневого узла как основные элементы дерева
        }
      } catch (error) {
        console.error('Ошибка при обновлении дерева:', error)
      }
    },
  },
}
</script>
