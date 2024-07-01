const axios = require('axios')
const config = require('./config')

const baseUrl = config.api.baseUrl

console.log(baseUrl)

describe('Тесты API', () => {
  // Здесь остаются тесты для инструмента

  describe('Параметры инструмента', () => {
    let createdParamId

    it('Получение всех параметров инструмента', async () => {
      console.log('--- Получение всех параметров инструмента ---')
      const response = await axios.get(`${baseUrl}/tools-params`)
      console.log('Получен ответ:', response.data)

      // Проверка структуры каждого элемента в массиве
      response.data.forEach(element => {
        expect(element).toHaveProperty('id')
        expect(element).toHaveProperty('label')
        expect(element).toHaveProperty('param_order')
      })
    })

    it('Добавление нового параметра инструмента', async () => {
      console.log('--- Добавление нового параметра инструмента ---')
      const newParamData = {
        'label': 'Новый параметр',
      }
      const response = await axios.post(`${baseUrl}/tools-params`, newParamData)
      console.log('Получен ответ:', response.data)

      expect(response.status).toBe(201)
      createdParamId = response.data.id // Сохраняем ID для последующих действий
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('label', newParamData.label)
    })

    it('Изменение созданного параметра инструмента', async () => {
      console.log('--- Изменение созданного параметра инструмента ---')
      const updateParamData = { 'label': 'Ширина' }
      const response = await axios.put(`${baseUrl}/tools-params/${createdParamId}`, updateParamData)
      console.log('Получен ответ:', response.data)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', createdParamId)
      expect(response.data).toHaveProperty('label', updateParamData.label)
    })

    it('Удаление созданного параметра инструмента', async () => {
      console.log('--- Удаление созданного параметра инструмента ---')
      const response = await axios.delete(`${baseUrl}/tools-params/${createdParamId}`)
      expect(response.status).toBe(200)

      // Дополнительная проверка на подтверждение удаления
      try {
        await axios.get(`${baseUrl}/tools-params/${createdParamId}`)
        // Если запрос прошел успешно, значит элемент не был удален, что является ошибкой
        throw new Error('Параметр должен был быть удален')
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    })

  })

}) // Конец главной группы тестов
