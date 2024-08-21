import { createPinia } from 'pinia'
import { useEditorToolStore } from '@/modules/tools/editor/piniaStore'
// import { useIssueToolStore } from '@/modules/tools/issue/store'
// import { useViewToolStore } from '@/modules/tools/view/store'
import { useAuthStore } from './authStorePinia'

const pinia = createPinia()

export default pinia
