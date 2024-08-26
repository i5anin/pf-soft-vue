
// modules/tools/editor/store/movement.js
import { defineStore } from 'pinia'
import { editorToolApi } from '@/modules/tools/editor/api/editor'

export const useMovementStore = defineStore('movementStore', {
  state: () => ({
    movements: [],
  }),
  actions: {
    // Action для загрузки истории движения инструмента
    async fetchMovementHistory(toolId) {
      try {
        this.movements = (await editorToolApi.getToolMovementById(toolId)).map(
          (item) => ({
            ...item,
            change: (item.new_amount || 0) - (item.old_amount || 0),
          }),
        )
      } catch (error) {
        console.error('Ошибка при загрузке истории движения:', error)
      }
    },
  },
  getters: {
    getMovementHistoryByToolId: (state) => (toolId) =>
      state.movements.filter((movement) => movement.tool_id === toolId),
  },
})
