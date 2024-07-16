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

beforeAll(async () => {
  try {
    // 1. Получение токена аутентификации
    const loginResponse = await axios.post(`${baseUrl}/login`, {
      login: 'Тест API',
      password: 'pfforum',
    })

    token = loginResponse.data.token
    console.log('Получен токен:', token)

    const headers = {
      Authorization: `Bearer ${token}`,
    }

    // 2. Получение данных об инструментах и извлечение ID
    const toolsResponse = await axios.get(`${baseUrl}/tools`, { headers })
    const tools = toolsResponse.data.tools

    // Проверка наличия инструментов
    if (tools.length < 2) {
      throw new Error('Недостаточно инструментов для теста.')
    }

    const toolId1 = tools[0].id
    const toolId2 = tools[1].id

    console.log('Ответ на запрос инструментов:', toolsResponse.data)

    // 3. Подготовка данных для выдачи (включая issueToken)
    const issueData = {
      issueToken: token, // Токен в теле запроса
      operationId: 99021,
      tools: [
        { toolId: toolId1, quantity: 2 },
        { toolId: toolId2, quantity: 2 },
      ],
      typeIssue: 0,
      userId: 58,
    }

    console.log('Данные для выдачи инструментов:', issueData)

    // 4. Выдача инструментов
    const issueResponse = await axios.post(`${baseUrl}/issues`, issueData, { headers })
    console.log('Получен ответ на выдачу:', issueResponse.data)

    // 5. Ассерты (проверки)
    expect(issueResponse.status).toBe(200)
    expect(issueResponse.data).toHaveProperty('id')
    const createdIssueId = issueResponse.data.id
    console.log('ID созданного выпуска:', createdIssueId)
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.message)
    throw error // Прекращение тестов в случае ошибки
  }
})

it('Получение данных для модального окна выдачи', async () => {
  const testData = [
    { url: '/modal-form/parties', description: 'Поиск партий' },
    { url: '/modal-form/cnc', description: 'Данные ЧПУ' },
    { url: '/modal-form/operators/fio', description: 'ФИО операторов' },
  ]

  for (const data of testData) {
    console.log(`--- Получение данных для модального окна: ${data.description} ---`)
    const response = await axios.get(`${baseUrl}${data.url}`)
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
  console.log('--- Отмена операции выдачи администратором ---')
  const response = await axios.get(`${baseUrl}/issue/cancel-operation-admin/${createdIssueId}`)
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  expect(response.data).toBe(true)
})
