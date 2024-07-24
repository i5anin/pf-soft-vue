const { Pool } = require('pg')
const getDbConfig = require('../../../../config/databaseConfig')
const fs = require('fs')

// Настройка подключения к базе данных

const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

async function getTableReportData(req, res) {
  try {
    const sql = fs.readFileSync(__dirname + '/OrderToolsVue.sql', 'utf-8')
    const { rows } = await pool.query(sql)
    res.json(rows)
  } catch (error) {
    console.error('Ошибка при получении данных для таблицы:', error)
    res.status(500).send('Ошибка при получении данных для таблицы')
  }
}

module.exports = { getTableReportData }
