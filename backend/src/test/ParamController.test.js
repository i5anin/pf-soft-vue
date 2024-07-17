const axios = require('axios')
const config = require('./config-test')

const baseUrl = config.api.baseUrl

console.log(baseUrl)

let createdParamId

console.log('createdParamId = ', createdParamId)

it('Получение всех параметров инструмента', async () => {
  console.log('--- Получение всех параметров инструмента ---')
  const response = await axios.get(`${baseUrl}/tools-params`)
  console.log('Получен ответ:', response.data)

  // Проверка структуры каждого элемента в массиве
  response.data.forEach((element) => {
    expect(element).toHaveProperty('id')
    expect(element).toHaveProperty('label')
    expect(element).toHaveProperty('param_order')
  })
})

it('Добавление нового параметра инструмента', async () => {
  console.log('--- Добавление нового параметра инструмента ---')
  const newParamData = {
    label: 'Новый параметр',
  }
  const response = await axios.post(`${baseUrl}/tools-params`, newParamData)
  console.log('Получен ответ:', response.data)
  console.log('response:', response.data.id)

  expect(response.status).toBe(201)
  createdParamId = response.data.id // Сохраняем ID для последующих действий
  expect(response.data).toHaveProperty('id')
  expect(response.data).toHaveProperty('label', newParamData.label)
})

it('Изменение созданного параметра инструмента', async () => {
  console.log('--- Изменение созданного параметра инструмента ---')
  const updateParamData = { label: 'Ширина' }
  console.log('Проверка:', createdParamId)
  const response = await axios.put(
    `${baseUrl}/tools-params/${createdParamId}`,
    updateParamData
  )
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  // expect(response.data).toHaveProperty('id', createdParamId)
  // expect(response.data).toHaveProperty('label', updateParamData.label)
})

it('Удаление созданного параметра инструмента', async () => {
  console.log('--- Удаление созданного параметра инструмента ---')
  const deleteResponse = await axios.delete(
    `${baseUrl}/tools-params/${createdParamId}`
  )
  expect(deleteResponse.status).toBe(200)

  // Получаем список всех параметров
  const getResponse = await axios.get(`${baseUrl}/tools-params/`)
  expect(getResponse.status).toBe(200) // Ожидаем успешный ответ со списком

  // Проверяем, что удалённый параметр отсутствует в списке
  const params = getResponse.data // Предполагаем, что бэкенд возвращает массив параметров
  expect(params).not.toContainEqual(expect.objectContaining({ id: createdParamId }))
})
