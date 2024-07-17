const axios = require('axios')
const config = require('../../config/config-test')

const baseUrl = config.api.baseUrl

// Функция для проверки существования инструмента
async function checkToolExists(toolId) {
  try {
    const response = await axios.get(`${baseUrl}/tool/${toolId}`)
    return response.status === 200
  } catch (error) {
    return false
  }
}

let token

beforeAll(async () => {
  try {
    const body = {
      login: 'Тест API',
      password: 'pfforum',
    }
    const loginResponse = await axios.post(`${baseUrl}/login`, body)
    token = loginResponse.data.token
    console.log('Токен получен:', token)
  } catch (error) {
    console.error('Ошибка получения токена:', error.message)
    throw error
  }
})

it('Выдача инструментов', async () => {
  try {
    // 1. Получение данных об инструментах (токен в теле):
    const toolsResponse = await axios.get(`${baseUrl}/tools`)

    // console.log('tools = ', toolsResponse.data.tools)

    const tools = toolsResponse.data.tools
    const toolId1 = tools[0].id
    const toolId2 = tools[1].id
    console.log('toolId1 = ', toolId1)
    console.log('toolId2 = ', toolId2)

    // 2. Подготовка данных для выдачи (токен в теле):
    console.log('token = ', token)
    const issueData = {
      issueToken: token,
      operationId: 99021,
      tools: [
        { toolId: toolId1, quantity: 2 },
        { toolId: toolId2, quantity: 2 },
      ],
      typeIssue: 0,
      userId: 58,
    }

    // 3. Выдача инструментов (токен в теле):
    const issueResponse = await axios.post(`${baseUrl}/issues`, issueData)

    console.log('Получен ответ:', issueResponse.data)

    // 4. Проверки:
    expect(issueResponse.status).toBe(200)
    // expect(issueResponse.data).toHaveProperty('id')
    // const createdIssueId = issueResponse.data.id
    // console.log('ID созданного выпуска:', createdIssueId)
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.message)
    throw error
  }
})

it('Получение данных для модального окна выдачи', async () => {
  const testData = [
    { url: '/modal-form/parties', params: { id: 40487 }, description: 'Поиск партий' },
    { url: '/modal-form/cnc', description: 'Данные ЧПУ' },
    { url: '/modal-form/operators/fio', description: 'ФИО операторов' },
  ]

  for (const data of testData) {
    console.log(`--- Получение данных для модального окна: ${data.description} ---`)
    const response = await axios.get(`${baseUrl}${data.url}`, {
      params: data.params, // Передаем параметры здесь
    })
    console.log('Получен ответ:', response.data)

    expect(response.status).toBe(200)

    if (Array.isArray(response.data)) {
      expect(response.data.length).toBeGreaterThan(0)
    } else {
      expect(Object.keys(response.data).length).toBeGreaterThan(0)
    }
  }
})

it('Отмена операции выдачи администратором', async () => {
  console.log('--- Отмена операции выдачи ---')
  const response = await axios.get(`${baseUrl}/issue/cancel-operation/${createdIssueId}`)
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  expect(response.data).toBe(true)
})

it('Отмена операции выдачи администратором', async () => {
  console.log('--- Отмена операции выдачи администратором ---')
  const response = await axios.get(`${baseUrl}/issue/cancel-operation-admin/${createdIssueId}`)
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  expect(response.data).toBe(true)
})
