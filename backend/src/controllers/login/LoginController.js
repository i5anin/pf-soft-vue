const { Pool } = require('pg')
const { v4: uuidv4 } = require('uuid')
require('dotenv').config() // Это должно быть в самом верху файла
// const jwt = require('jsonwebtoken')
const { getNetworkDetails } = require('../../config/db_type')
const getDbConfig = require('../../config/databaseConfig')

const dbConfig = getDbConfig()
const dbName = dbConfig.database // Добавляем название базы данных из конфигурации

// Создание пула соединений с базой данных
const pool = new Pool(dbConfig)

async function getDatabaseInfo(req, res) {
  try {
    const dbInfo = getNetworkDetails()
    res.json({ ...dbInfo, dbName }) // Добавляем название базы данных в ответ
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
async function login(req, res) {
  try {
    const { login, password } = req.body
    // Проверяем существование пользователя
    const userQuery = 'SELECT * FROM dbo.vue_users WHERE login = $1'
    const userResult = await pool.query(userQuery, [login])

    if (userResult.rows.length > 0 && userResult.rows[0].password === password) {
      // Пользователь найден и пароль совпадает, генерируем токен
      const token = uuidv4()
      const now = new Date()
      // Предположим, что IP можно получить напрямую из req.ip, это может отличаться в зависимости от настроек прокси/балансировщика нагрузки
      const userIP = req.ip

      // console.log(req.ip)

      const updateTokenAndLoginInfoQuery =
        'UPDATE dbo.vue_users SET token = $1, last_login_date = $2, last_login_ip = $3 WHERE login = $4'
      await pool.query(updateTokenAndLoginInfoQuery, [token, now, userIP, login])

      res.json({ status: 'ok', token })
    } else {
      res
        .status(401)
        .json({ status: 'error', message: 'Неправильный логин или пароль' })
    }
  } catch (error) {
    console.error('Ошибка при логине:', error)
    res.status(500).json({ status: 'error', message: 'Внутренняя ошибка сервера' })
  }
}

async function checkLogin(req, res) {
  try {
    const { token } = req.body

    // Проверяем действительность токена и получаем роль пользователя
    const tokenQuery = 'SELECT * FROM dbo.vue_users WHERE token = $1'
    const tokenResult = await pool.query(tokenQuery, [token])

    if (tokenResult.rows.length > 0) {
      // Пользователь с таким токеном найден, отправляем данные пользователя вместе с его ролью
      const user = tokenResult.rows[0]
      const role = user.role // Предполагаем, что колонка с ролью называется 'role'

      res.json({ status: 'ok', user: user.login, role: role })
    } else {
      res.status(401).json({ status: 'error', message: 'Недействительный токен' })
    }
  } catch (error) {
    console.error('Ошибка при проверке токена:', error)
    res.status(500).json({ status: 'error', message: 'Внутренняя ошибка сервера' })
  }
}

module.exports = {
  getDatabaseInfo,
  checkLogin,
  login,
}
