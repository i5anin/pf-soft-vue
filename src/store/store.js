import Vuex from 'vuex'
import EditorToolStore from '@/modules/tools/editor/store'
import IssueToolStore from '@/modules/tools/issue/store'
import ViewToolStore from '@/modules/tools/view/store'
import AuthStore from './authStore'

const store = new Vuex.Store({
  modules: { IssueToolStore, EditorToolStore, AuthStore, ViewToolStore },
})

// StorageToolStore

export default store
