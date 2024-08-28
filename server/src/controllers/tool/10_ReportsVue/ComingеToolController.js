const { Pool } = require('pg');
const getDbConfig = require('../../../config/databaseConfig');

const dbConfig = getDbConfig();
const pool = new Pool(dbConfig);

async function getComingTool(req, res) {
  try {
    const query = `
        SELECT *
        FROM dbo.vue_log
        WHERE message LIKE '%Добавлен%' OR (message LIKE '%Обновлен%' AND new_amount > old_amount)
        ORDER BY datetime_log DESC
    `;
    const result = await pool.query(query);
    const comingTools = result.rows;

    // Преобразование даты в читаемый формат
    const formattedComingTools = comingTools.map(tool => ({
      ...tool,
      datetime_log: tool.datetime_log.toISOString(),
    }));

    // Возврат данных в формате JSON в ответе
    res.json(formattedComingTools);
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
    res.status(500).send("Ошибка при получении данных");
  } finally {
    await pool.end(); // Закрытие соединения с БД
  }
}

module.exports = {
  getComingTool
};
