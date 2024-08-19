import { defineStore } from 'pinia'

const useEditorToolStore = defineStore('reportZakaz', {
  state: () => ({
    isModalOpen: false,
    selectedToolId: null,
  }),

  actions: {
    openModal(toolId) {
      this.selectedToolId = toolId
      this.isModalOpen = true
    },

    closeModal() {
      this.isModalOpen = false
    },
  },

  getters: {
    getModalStatus(state) {
      return state.isModalOpen
    },

    getSelectedToolId(state) {
      return state.selectedToolId
    },
  },
})

export { useEditorToolStore }
