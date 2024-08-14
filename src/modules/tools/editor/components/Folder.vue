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
          {{ currentItem?.label || 'Редактор' }}
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
          <v-btn
            title="Удалить папку"
            icon
            small
            @click.stop="deleteItem(currentItem?.id)"
          >
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
      editorToolStore: useEditorToolStore(), // Инициализируем store в data()
      tree: [],
      currentItem: null,
      isEditing: false,
      editableLabel: '',
    }
  },
  computed: {
    isTableShown() {
      return this.editorToolStore.getParentCatalog.id !== 1 // Доступ к getter через store
    },
  },

  methods: {
    async deleteItem() {
      if (!this.currentItem) return alert('Не выбрана папка для удаления.')
      const itemId = this.currentItem.id
      if (confirm(`Уверены, что хотите удалить ${this.currentItem.label}?`)) {
        try {
          await toolTreeApi.deleteFolder(itemId)
          alert('Папка успешно удалена.')
          if (this.tree.length > 1) {
            this.tree.pop()
            this.currentItem = this.tree[this.tree.length - 1]
          }
          await this.refreshTree()
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
          const newFolder = {
            id: newBranch.newBranchId,
            label: branchName,
            elements: 0,
            nodes: [],
          }
          this.currentItem.nodes.push(newFolder)
          this.currentItem = newFolder
          this.tree.push(newFolder)
        } catch (error) {
          alert('Произошла ошибка при добавлении ветки.')
        }
      }
    },
    startEditing() {
      this.isEditing = true
      this.editableLabel = this.currentItem ? this.currentItem.label : ''
    },

    finishEditing() {
      if (
        this.isEditing &&
        this.currentItem &&
        this.editableLabel !== this.currentItem.label
      ) {
        this.renameCurrentItem()
      }
      this.isEditing = false
    },

    goBack() {
      if (this.tree.length > 1) {
        this.tree.pop()
        this.currentItem = this.tree[this.tree.length - 1]
        this.editorToolStore.setParentCatalog({
          id: this.currentItem.id,
          label: this.currentItem.label,
        })
      }
    },
  },
}
</script>

<style scoped></style>
