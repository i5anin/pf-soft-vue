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
  // Logic to get the authentication token
  try {
    const loginResponse = await axios.post(`${baseUrl}/login`, {
      login: 'Тест API',
      password: 'pfforum',
    })

    token = loginResponse.data.token // Token should be available now
    console.log('Token obtained:', token)
  } catch (error) {
    console.error('Error obtaining token:', error.message)
    throw error // Fail the tests if token retrieval fails
  }
})

it('Выдача инструментов', async () => {
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  try {
    // Получение данных об инструментах
    const response = await axios.get(`${baseUrl}/tools`, { headers })
    const tools = response.data.tools

    // Извлечение двух первых ID
    const toolIds = tools.slice(0, 2).map((tool) => tool.id)
    console.log('ID инструментов:', toolIds)

    console.log('--- Выдача инструментов ---')
    const issueData = {
      date_issue: '2024-01-30T21:00:00.000Z',
      cnc: 1,
      party: 1,
      operator: 1,
      taken: [
        { tool_id: toolIds[0], amount: 1 },
        { tool_id: toolIds[1], amount: 2 },
      ],
      issueToken: token, // Include token in request body
    }

    const issueResponse = await axios.post(`${baseUrl}/issues`, issueData, { headers })
    console.log('Получен ответ:', issueResponse.data)

    expect(issueResponse.status).toBe(200)
    expect(issueResponse.data).toHaveProperty('id')
    const createdIssueId = issueResponse.data.id

    console.log('ID созданного выпуска:', createdIssueId)
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.message)
    throw error // Re-throw to fail the test
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
