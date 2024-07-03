//app.js

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('./config/config')
const routers = require('./routers')
const { getNetworkDetails } = require('./config/db_type')
const getDbConfig = require('./config/databaseConfig')
const dbConfig = getDbConfig()
const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')
const specs = swaggerJsdoc(require('./config/swaggerConfig'))
const app = express()

console.log('\x1b[36m%s\x1b[0m', '• Почтовый сервер:')
console.log('Host:', process.env.MAIL_HOST)
console.log('Port:', process.env.MAIL_PORT)
// console.log('Pass:', process.env.MAIL_PASS)
console.log('From:', process.env.MAIL_USER)
console.log('To:', process.env.MAIL_TO)

console.log('\x1b[31m%s\x1b[0m', '\n• Конфигурация базы данных:')
console.log('User:', process.env.DB_USER || process.env.DB_TEST_USER)
console.log('Host:', process.env.DB_HOST || process.env.DB_TEST_HOST)
console.log('Database:', process.env.DB_NAME || process.env.DB_TEST_NAME)
// console.log('Password:',  process.env.DB_PASSWORD || process.env.DB_TEST_PASSWORD)
console.log('Port:', process.env.DB_PORT || process.env.DB_TEST_PORT)

app.use(bodyParser.json())
app.use(cors())
app.use('/api-docs/SecretKey', swaggerUi.serve, swaggerUi.setup(specs))

app.use(bodyParser.json())
app.use(cors())
app.use('/api', routers)

app.use((err, req, res, _) => {
  console.error(err.stack)
  res.status(err.status || 500).send({
    status: err.status || 500,
    message: err.message || 'Произошла ошибка на сервере',
  })
})

try {
  const { localIp } = getNetworkDetails()
  app.listen(config.port, localIp, () => {
    console.log(`DB connect http://${dbConfig.host}:${dbConfig.port}`)
    console.log(`Server is running on http://${localIp}:${config.server.port}`)
  })
} catch (error) {
  console.error(error.message)
}
