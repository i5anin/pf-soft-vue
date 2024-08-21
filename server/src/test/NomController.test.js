const axios = require('axios')
const config = require('./config-test')

const baseUrl = config.api.baseUrl

console.log(baseUrl)

let createdRecordId
let createdParamId
let createdTreeFolderId
let createdIssueId

describe('Работа с создание номенклатур', () => {
  // Группа тестов для инструмента
  it('Создание нового инструмента', async () => {
    const newRecordData = {
      name: 'Название',
      parent_id: 239,
      property: {
        6: 'Параметр значение',
        10: '1001',
        17: '1001',
      },
      sklad: '10',
      norma: '15',
      group_id: '1001',
      group_standard: true,
      limit: null,
    }

    console.log('--- Создание нового инструмента ---')
    console.log('Отправляю данные:', newRecordData)
    const response = await axios.post(baseUrl + '/tool', newRecordData)

    console.log('Получен ответ:', response.data)
    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('id')
    expect(response.data.data).toHaveProperty('name', newRecordData.name)
    expect(response.data.data).toHaveProperty(
      'parent_id',
      newRecordData.parent_id
    )

    createdRecordId = response.data.data.id
    console.log('Созданный ID:', createdRecordId)
  })

  it('Получение созданного инструмента', async () => {
    console.log('--- Получение созданного инструмента ---')
    const response = await axios.get(
      `${baseUrl}/tool/modal-form/${createdRecordId}`
    )
    console.log('Получен ответ:', response.data)

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('id', createdRecordId)
    expect(response.data).toHaveProperty('name', 'Название')
    // Добавьте другие проверки полей, если необходимо
  })

  it('Изменение существующего инструмента', async () => {
    console.log('--- Изменение существующего инструмента ---')
    const updatedRecordData = {
      name: 'Измененный инструмент',
      parent_id: 2,
      property: {
        1: 'Тип инструмента',
        2: 'Группа инструмента',
        3: 'Материал инструмента',
        4: 'Ширина',
        5: 'Габарит',
      },
      sklad: 1,
      norma: 2,
    }

    console.log('Отправляю данные:', updatedRecordData)
    const response = await axios.put(
      `${baseUrl}/tool/${createdRecordId}`,
      updatedRecordData
    )
    console.log('Получен ответ:', response.data)

    expect(response.status).toBe(200)
    expect(response.data.data).toHaveProperty('id', createdRecordId)
    expect(response.data.data).toHaveProperty('name', updatedRecordData.name)
    expect(response.data.data).toHaveProperty(
      'parent_id',
      updatedRecordData.parent_id
    )
    expect(response.data.data).toHaveProperty(
      'property',
      updatedRecordData.property
    )
  })

  it('Удаление инструмента', async () => {
    console.log('--- Удаление инструмента ---')
    const response = await axios.delete(`${baseUrl}/tool/${createdRecordId}`)
    console.log('Получен ответ:', response.data)
    expect(response.status).toBe(200)
  })

  it('Проверка удаления инструмента', async () => {
    console.log('--- Проверка удаления ---')
    try {
      console.log('createdRecordId:', createdRecordId)
      const response = await axios.get(`${baseUrl}/tool/${createdRecordId}`)
      console.log('Получен ответ:', response.data)
    } catch (error) {
      console.log(
        'Ошибка:',
        error.response ? error.response.data : error.message
      )
      expect(error.response.status).toBe(404)
    }
  })
}) // Конец группы тестов для инструмента

it('Проверка фильтрации папки', async () => {
  console.log('--- Проверка фильтров папки ---')
  const folderId = 200
  try {
    const response = await axios.get(
      `${baseUrl}/tools/params/${folderId}/filter`
    )
    console.log('Получен ответ:', response.data)

    // Функция проверки структуры каждого элемента в массиве
    function validateStructure(element) {
      expect(element).toHaveProperty('param_order')
      expect(element).toHaveProperty('key')
      expect(element).toHaveProperty('label')
      expect(element).toHaveProperty('values')

      // Проверяем, что 'values' это массив
      expect(Array.isArray(element.values)).toBe(true)
    }

    response.data.forEach((element) => validateStructure(element))
  } catch (error) {
    console.log('Ошибка:', error.response ? error.response.data : error.message)
    throw error
  }
})
