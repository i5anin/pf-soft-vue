<template>
  <v-app-bar app dark>
    <v-toolbar-title>
      <div class="text-h6">
        <v-text-field
          v-if="isEditing"
          v-model="editableLabel"
          dense
          solo
          hide-details
          :flat="true"
          :autofocus="true"
          @blur="finishEditing"
          @keyup.enter="finishEditing"
        />
        <span v-else @click="startEditing">
          {{ currentItem?.label || '[НЕТ НАЗВАНИЯ]' }}
          <v-btn
            title="Переименовать папку"
            icon
            small
            @click.stop="startEditing"
          >
            <v-icon icon="mdi-pencil" />
          </v-btn>
          <v-btn title="Добавить папку" icon small @click.stop="addItem">
            <v-icon icon="mdi-folder-plus" />
          </v-btn>
          <v-btn title="Удалить папку" icon small @click.stop="deleteItem">
            <v-icon icon="mdi-delete" />
          </v-btn>
        </span>
      </div>
    </v-toolbar-title>
    <v-spacer />
    <v-btn title="Назад" icon @click="goBack">
      <v-icon icon="mdi-arrow-left" />
    </v-btn>
  </v-app-bar>
</template>

<script>
import { useEditorToolStore } from '@/modules/tools/editor/piniaStore'
import { toolTreeApi } from '@/modules/tools/tree/api/tree'

export default {
  name: 'Folder',
  data() {
    return {
      editorToolStore: useEditorToolStore(),
      isEditing: false,
      editableLabel: '',
    }
  },
  computed: {
    currentItem() {
      return this.editorToolStore.getCurrentItem
    },
    tree() {
      return this.editorToolStore.getTree
    },
  },
  methods: {
    async deleteItem() {
      if (!this.currentItem) return alert('Не выбрана папка для удаления.')
      if (confirm(`Уверены, что хотите удалить ${this.currentItem.label}?`)) {
        try {
          await toolTreeApi.deleteFolder(this.currentItem.id)
          alert('Папка успешно удалена.')
          await this.editorToolStore.refreshTree()
        } catch (error) {
          console.error('Ошибка при удалении:', error)
          alert('Произошла ошибка при удалении.')
        }
      }
    },

    async addItem() {
      if (!this.currentItem || !this.currentItem.nodes)
        return alert('Выберите категорию для добавления новой папки.')

      let branchName = prompt('Введите название новой ветки:')
      if (branchName) {
        try {
          const newBranch = await toolTreeApi.addFolder(
            branchName,
            this.currentItem.id
          )
          await this.editorToolStore.addFolderToTree(
            newBranch.newBranchId,
            branchName
          )
        } catch (error) {
          console.error(error)
          alert('Произошла ошибка при добавлении ветки.')
        }
      }
    },

    startEditing() {
      this.isEditing = true
      this.editableLabel = this.currentItem ? this.currentItem.label : ''
    },

    async finishEditing() {
      if (
        this.isEditing &&
        this.currentItem &&
        this.editableLabel !== this.currentItem.label
      ) {
        try {
          await toolTreeApi.renameFolder(
            this.currentItem.id,
            this.editableLabel
          )
          await this.editorToolStore.renameFolderInTree(
            this.currentItem.id,
            this.editableLabel
          )
        } catch (error) {
          console.error('Ошибка при переименовании:', error)
          alert('Произошла ошибка при переименовании.')
        }
      }
      this.isEditing = false
    },

    goBack() {
      this.editorToolStore.goBackInTree()
    },
  },
}
</script>
