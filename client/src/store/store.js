import Vuex from 'vuex'
import IssueToolStore from '@/modules/tools/issue/store'
import ViewToolStore from '@/modules/tools/view/store'
import AuthStore from './authStore'

const store = new Vuex.Store({
  modules: { IssueToolStore, AuthStore, ViewToolStore },
})

// StorageToolStore

export default store
