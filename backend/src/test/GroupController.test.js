const axios = require('axios')
const config = require('./config-test')

const baseUrl = config.api.baseUrl

it('Получение списка инструментов, сгруппированных по ID группы', async () => {
  console.log('--- Получение списка инструментов, сгруппированных по ID группы ---')
  const response = await axios.get(`${baseUrl}/tools-groups`)

  console.log('Получен ответ:', response.data)
  expect(response.status).toBe(200)

  // Проверяем структуру ответа
  expect(response.data).toBeInstanceOf(Object)

  // Проверяем наличие нескольких групп
  expect(Object.keys(response.data).length).toBeGreaterThan(1)

  // Проверяем данные в одной из групп (например, группа с ID 1)
  const group1 = response.data['1']
  expect(group1).toBeInstanceOf(Array)
  expect(group1.length).toBeGreaterThan(0)

  const firstToolInGroup1 = group1[0]
  expect(firstToolInGroup1).toHaveProperty('id')
  expect(firstToolInGroup1).toHaveProperty('name')
  expect(firstToolInGroup1).toHaveProperty('sklad')
  // Добавьте другие проверки для свойств инструментов

  // Добавьте проверки для других групп, если необходимо
})
