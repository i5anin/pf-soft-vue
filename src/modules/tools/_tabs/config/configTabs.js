import { markRaw } from 'vue'

import HistoryIssue from '@/modules/tools/history-issue/components/Table.vue'
import HistoryDamaged from '@/modules/tools/history-damaged/components/Table.vue'

import ToolTabParam from '@/modules/tools/params/components/Param.vue'
import ToolTabGroup from '@/modules/tools/groups/components/Groups.vue'
import ToolTabTree from '@/modules/tools/tree/components/Tree.vue'
import Report from '@/modules/tools/report-zakaz/components/Report.vue'
import ReportBuh from '@/modules/tools/report-buh/components/Report.vue'
import ReportRevision from '@/modules/tools/revision/components/Report.vue'

import EditorCatalog from '@/modules/tools/editor/components/Catalog.vue'
import IssueCatalog from '@/modules/tools/issue/components/Catalog.vue'

import ViewCatalog from '@/modules/tools/view/components/Catalog.vue'

const tabs = [
  {
    name: 'Редактор',
    url: '#editor',
    component: markRaw(EditorCatalog),
    access: ['Admin', 'Editor'],
    ico: 'mdi-pencil',
  },
  {
    name: 'Параметры',
    url: '#params',
    component: markRaw(ToolTabParam),
    access: ['Admin', 'Editor'],
    ico: 'mdi-playlist-plus',
  },
  {
    name: 'Группы',
    url: '#groups',
    component: markRaw(ToolTabGroup),
    access: ['Admin', 'Editor'],
    ico: 'mdi-format-list-group',
  },
  {
    name: 'Выдать / поврежден',
    url: '#issue',
    component: markRaw(IssueCatalog),
    access: ['Admin', 'Editor', 'Issue'],
    ico: 'mdi-list-status',
  },
  {
    name: 'История выдачи',
    url: '#history_issue',
    component: markRaw(HistoryIssue),
    access: ['Admin', 'Editor', 'Issue'],
    ico: 'mdi-history',
  },
  {
    name: 'История поврежденного',
    url: '#history_damaged',
    component: markRaw(HistoryDamaged),
    access: ['Admin', 'Editor', 'Issue'],
    ico: 'mdi-history',
  },
  {
    name: 'Просмотр',
    url: '#view',
    component: markRaw(ViewCatalog),
    access: ['Admin', 'View', 'Editor'],
    ico: 'mdi-eye',
  },
  {
    name: 'Дерево',
    url: '#tree',
    component: markRaw(ToolTabTree),
    access: ['Admin', 'Editor', 'Issue', 'View'],
    ico: 'mdi-file-tree',
  },
  {
    name: 'Заказ',
    url: '#report',
    component: markRaw(Report),
    access: ['Admin', 'Editor', 'Issue'],
    ico: 'mdi-package-variant',
  },
  // {
  //   name: 'Отчёт бухгалтерия',
  //   url: '#report-buh',
  //   component: markRaw(ReportBuh),
  //   access: ['Admin'],
  //   ico: 'mdi-currency-rub',
  // },
  // {
  //   name: 'Ревизия',
  //   url: '#test',
  //   component: markRaw(ReportRevision),
  //   access: ['Admin'],
  //   ico: 'mdi-test-tube',
  // },
]

export default tabs
