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
  props: ['currentItem'],
  emits: ['update:currentItem'],
  data() {
    return {
      editorToolStore: useEditorToolStore(),
      tree: [],
      isEditing: false,
      editableLabel: '',
    }
  },
  methods: {
    async deleteItem() {
      if (!this.currentItem) {
        alert('Не выбрана папка для удаления.')
        return
      }
      const itemId = this.currentItem.id
      if (confirm(`Уверены, что хотите удалить ${this.currentItem.label}?`)) {
        try {
          await toolTreeApi.deleteFolder(itemId)
          alert('Папка успешно удалена.')
          if (this.tree.length > 1) {
            this.tree.pop()
            this.$emit('update:currentItem', this.tree[this.tree.length - 1])
          }
          await this.$parent.refreshTree()
        } catch (error) {
          console.error('Ошибка при удалении:', error)
          alert('Произошла ошибка при удалении.')
        }
      }
    },

    async addItem() {
      if (!this.currentItem || !this.currentItem.nodes) {
        alert('Выберите категорию для добавления новой папки.')
        return
      }

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
          this.$emit('update:currentItem', newFolder)
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
        this.$emit('update:currentItem', this.tree[this.tree.length - 1])
      }
    },
  },
}
</script>
