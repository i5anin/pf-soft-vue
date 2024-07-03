const axios = require('axios')
const config = require('../../config/config-test')

const baseUrl = config.api.baseUrl

console.log(baseUrl)


it('Выдача инструментов', async () => {
  console.log('--- Выдача инструментов ---')
  const issueData = {
    'date_issue': '2024-01-30T21:00:00.000Z',
    'cnc': 1,
    'party': 1,
    'operator': 1,
    'taken': [
      { 'tool_id': 591, 'amount': 1 },
      { 'tool_id': 592, 'amount': 2 },
    ],
  }
  const response = await axios.post(`${baseUrl}/issues`, issueData)
  console.log('Получен ответ:', response.data)

  expect(response.status).toBe(200)
  expect(response.data).toHaveProperty('id')
  createdIssueId = response.data.id
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


