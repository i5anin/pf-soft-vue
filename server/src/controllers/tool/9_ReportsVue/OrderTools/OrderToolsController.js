const { Pool } = require('pg');
const getDbConfig = require('../../../../config/databaseConfig');
const fs = require('fs');

// Настройка подключения к базе данных
const dbConfig = getDbConfig();
const pool = new Pool(dbConfig);

async function getTableReportData(req, res) {
  try {
    // Считываем SQL-запросы из файлов
    const missingPercentSql = fs.readFileSync(__dirname + '/missing_percent.sql', 'utf-8');
    const statusCodeColorSql = fs.readFileSync(__dirname + '/status_color.sql', 'utf-8');
    const orderToolsVueSql = fs.readFileSync(__dirname + '/OrderToolsVue.sql', 'utf-8');

    // Выполняем SQL-запросы последовательно
    await pool.query(missingPercentSql);
    await pool.query(statusCodeColorSql);
    const { rows } = await pool.query(orderToolsVueSql);

    // Возвращаем данные в виде JSON
    res.json(rows);
  } catch (error) {
    console.error('Ошибка при получении данных для таблицы:', error);
    res.status(500).send('Ошибка при получении данных для таблицы');
  }
}

module.exports = { getTableReportData };