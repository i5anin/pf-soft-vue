const axios = require('axios')
const config = require('../../../config/config-test')

const baseUrl = config.api.baseUrl

console.log(baseUrl)

let createdRecordId
let createdParamId
let createdTreeFolderId
let createdIssueId

it('Получение дерева инструментов', async () => {
  console.log('--- Получение дерева инструментов ---')
  const response = await axios.get(`${baseUrl}/tools-tree`)
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  expect(Array.isArray(response.data)).toBe(true)
  // Проверьте структуру элементов массива, если необходимо
})

it('Добавление новой ветки в дерево', async () => {
  console.log('--- Добавление новой ветки в дерево ---')
  const newBranchData = {
    name: 'Новая папка',
    parentId: 2,
  }
  const response = await axios.post(`${baseUrl}/tools-tree`, newBranchData)
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  expect(response.data).toHaveProperty('newBranchId') // Проверяем newBranchId
  createdTreeFolderId = response.data.newBranchId // Сохраняем newBranchId

  expect(response.data).toHaveProperty('message', 'New branch added successfully.')
  // expect(response.data).toHaveProperty('newBranchId', newBranchData.newBranchId)
})

it('Изменение ветки в дереве', async () => {
  console.log('--- Изменение ветки в дереве ---')
  const updatedBranchData = {
    newName: 'Измененная папка',
  }
  const response = await axios.put(`${baseUrl}/tools-tree`, {
    id: createdTreeFolderId,
    ...updatedBranchData,
  })
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  // Удаляем лишние проверки:
  // expect(response.data).toHaveProperty('parent_id', updatedBranchData.parent_id)
  // expect(response.data).toHaveProperty('property', updatedBranchData.property)
})

it('Удаление ветки из дерева', async () => {
  console.log('--- Удаление ветки из дерева ---')
  const response = await axios.delete(`${baseUrl}/tools-tree/${createdTreeFolderId}`)
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  expect(response.data).toHaveProperty('message', 'Папка успешно удалена')
  // expect(response.data).toBe(true)
})
