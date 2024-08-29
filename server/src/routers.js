// routers.js

const express = require('express')
const router = express.Router()

const loginController = require('./controllers/login/LoginController')
const nomController = require('./controllers/tool/1_Nom/NomController')
const paramController = require('./controllers/tool/2_ParamController/ParamController')
const treeController = require('./controllers/tool/8_TreeController/TreeController')

const historyController = require('./controllers/tool/5_HistoryIssue/HistoryIssueController')
const historyControllerModal = require('./controllers/tool/5_HistoryIssue/HistoryIssueModalController')

const damagedController = require('./controllers/tool/6_HistoryDamaged/HistoryDamagedController')
const issueController = require('./controllers/tool/4_Issue/IssueController')

const reportBuchEndPartController = require('./controllers/tool/cron/BuchEndPart/BuchEndPartController')
const reportRedAlertController = require('./controllers/tool/cron/RedAlert/RedAlertToolsController')

const reportZakazController = require('./controllers/tool/ReportsEmail/OrderTools/OrderToolsController')
const reportSetupController = require('./controllers/tool/ReportsEmail/NaladReport/NaladReportController')

const reportRevisionController = require('./controllers/tool/ReportsEmail/RevisionTools/RevisionToolsController')

const reportVueZakazController = require('./controllers/tool/9_ReportsVue/OrderTools/OrderToolsController')
const reportVueBuhController = require('./controllers/tool/9_ReportsVue/BuchWeekController')

const reportComingTool = require('./controllers/tool/10_ReportsVue/ComingеToolController')

const groupsController = require('./controllers/tool/3_Group/GroupController')

// 'Аутентификация'
router.post('/login', loginController.login)
router.post('/check-login', loginController.checkLogin)
router.get('/database-info', loginController.getDatabaseInfo)

// "Инструмент"
router.get('/tools', nomController.getTools)
router.post('/tool', nomController.addTool)
router.put('/tool/:id', nomController.editTool)
router.delete('/tool/:id', nomController.deleteTool)
// "Главный фильтр"
router.get(
  '/tools/params/:parent_id/filter',
  nomController.filterParamsParentId
)
// "Инструмент Modal"
router.get('/tool/modal-form/:id', nomController.getToolById) //1 элемент router.get('/tool/:id', nomController.getToolById)
router.get('/tools/modal-form/:id/names', nomController.getToolNameId) // router.get('/tools-params-name/:id', paramController.getToolNameId)
router.get(
  '/tools/modal-form/:id/params',
  paramController.getToolParamsParentId
) // подсказки для заполнения router.get('/tools-params/:id', paramController.getToolParamsParentId)

// "Параметры"
router.get('/tools-params', paramController.getToolParams)
router.post('/tools-params', paramController.addToolParam)
router.put('/tools-params/:id', paramController.updateToolParam)
router.delete('/tools-params/:id', paramController.deleteToolParam)
// "Параметры дополнительно"
router.patch('/tools-params/:id/move', paramController.moveToolParam)

// "Дерево"
router.get('/tools-tree', treeController.getToolsTree)
router.post('/tools-tree', treeController.addBranch)
router.put('/tools-tree', treeController.updateFolderTree)
router.delete('/tools-tree/:id', treeController.dellFolderTree)

// "Выдача инструмента"
router.post('/issues', issueController.issueTools)
router.get('/modal-form/parties', issueController.findParties) //форма заполнения поиск партии
router.get('/modal-form/cnc', issueController.getCncData) //форма заполнения
router.get('/modal-form/operators/fio', issueController.getFioOperators) //форма заполнения
router.post('/issue/cancel-operation/:id', issueController.cancelOperation) //отмена операции 3 дня

// "История выдачи"
router.get('/history', historyController.getToolHistory)
router.get('/history-all-tool', historyController.getAllIssuedToolIdsWithNames) //инструмент для поиска
// router.get('/history/:id', historyController.getToolHistoryId)

// "История выдачи Modal"
router.get('/history-part', historyControllerModal.getToolHistoryByPartId) //история основной список
router.get(
  '/history-operation',
  historyControllerModal.getToolHistoryByOperationId
) //история по операции
router.get(
  '/history-part/info',
  historyControllerModal.getToolHistoryByPartIdInfo
) //история информация по партии
router.post('/history-add-archive', historyControllerModal.addToArchive) //архив истории выдачи

// "Движение инструмента"
router.get('/tool-movement/:id', historyController.getToolMovementById)

// "Группы"
router.get('/tools-groups', groupsController.getGroupedTools)

// "Поврежденный инструмент"
router.get('/damaged-history', damagedController.getDamaged)
router.post('/tool-history-damaged', damagedController.addToolHistoryDamaged)

// "Email report"
router.get('/report/zayav-instr', reportZakazController.genZayavInstr) // заявка на инструмент	раз в неделю каждый ЧТ в 12:00 (за неделю)
router.get('/report/setup', reportSetupController.genSetupReport) // заявка на инструмент	раз в неделю каждый ЧТ в 12:00 (за неделю)
router.get('/report/revision-instr', reportRevisionController.genRevisionInstr) // заявка на инструмент	раз в неделю каждый ЧТ в 12:00 (за неделю)
// "Email report Buch *CRON"
router.get(
  '/report/buch-end-op',
  reportBuchEndPartController.checkStatusChanges
) //в режиме CRON
router.get('/report/red-alert', reportRedAlertController.genRedAlert) //в режиме CRON

// "Vue"
router.get('/report/get-zakaz', reportVueZakazController.getTableReportData) // заявка на инструмент	раз в неделю каждый ЧТ в 12:00 (за неделю)
router.get('/report/getBuchWeek', reportVueBuhController.getTableReportData) //❓ бухгалтерию исключен сломанный	раз в неделю каждый ПТ в 12:00 (за неделю)

// "Приход"
router.get('/report/coming', reportComingTool.getComingTool)
router.get('/report/data-coming', reportComingTool.getComingToolDates)

module.exports = router
