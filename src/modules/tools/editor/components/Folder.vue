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
  props: {
    currentItem: {
      type: Object,
      required: true,
    },
    // Добавьте объявление props для refreshTree
    refreshTree: {
      type: Function,
      required: true,
    },
  },
  emits: ['update:currentItem'],
  data() {
    return {
      editorToolStore: useEditorToolStore(),
      isEditing: false,
      editableLabel: '',
      newFolder: {
        id: 0,
        label: '',
        elements: 0,
        nodes: [],
      },
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
          this.$emit('update:currentItem', null) // Очищаем currentItem при удалении
          await this.refreshTree() // Обновляем дерево после удаления
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
          await toolTreeApi.addFolder(branchName, this.currentItem.id)
          await this.refreshTree()
        } catch (error) {
          console.error('Ошибка при добавлении ветки:', error)
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
          this.currentItem.label = this.editableLabel // Обновляем label после переименования
          this.$emit('update:currentItem', this.currentItem) // Обновляем currentItem
          await this.refreshTree() // Обновляем дерево после переименования
        } catch (error) {
          console.error('Ошибка при переименовании:', error)
          alert('Произошла ошибка при переименовании.')
        }
      }
      this.isEditing = false
    },

    goBack() {
      if (this.$parent.tree.length > 1) {
        this.$parent.tree.pop()
        this.$emit(
          'update:currentItem',
          this.$parent.tree[this.$parent.tree.length - 1]
        )
      }
    },
  },
}
</script>
