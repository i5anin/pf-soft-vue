// swaggerConfig.js

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SOFT',
      version: '1.0.0',
      description: 'Описание вашего API инструмента',
    },
  },
  // Путь к файлам с документированными маршрутами
  apis: ['./src/swagger/*.yaml'], // Исправлен путь без хэштега
}

module.exports = swaggerOptions
