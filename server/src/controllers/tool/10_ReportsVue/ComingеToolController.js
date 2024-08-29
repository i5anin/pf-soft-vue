const { Pool } = require('pg');
const getDbConfig = require('../../../config/databaseConfig');

const dbConfig = getDbConfig();
const pool = new Pool(dbConfig);

async function getComingTool(req, res) {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 15, 10);
    const offset = (page - 1) * limit;
    const date = req.query.date;

    let whereClause = "WHERE (message LIKE '%Добавлен%' OR (message LIKE '%Обновлен%' AND new_amount > old_amount))";

    if (date) {
      whereClause += ` AND CAST(datetime_log AS DATE) = '${date}'`;
    }

    const query = `
      SELECT 
          vue_log.*,
          vue_users.login AS user_name,
          tool_nom.name AS tool_name
      FROM dbo.vue_log
      LEFT JOIN dbo.vue_users ON vue_log.user_id = vue_users.id
      LEFT JOIN dbo.tool_nom ON vue_log.tool_id = tool_nom.id
      ${whereClause}
      ORDER BY datetime_log DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM dbo.vue_log
      LEFT JOIN dbo.vue_users ON vue_log.user_id = vue_users.id
      LEFT JOIN dbo.tool_nom ON vue_log.tool_id = tool_nom.id
      ${whereClause}
    `;

    const result = await pool.query(query);
    const countResult = await pool.query(countQuery);
    const comingTools = result.rows;
    const totalCount = parseInt(countResult.rows[0].total_count, 10);

    const formattedComingTools = comingTools.map((tool) => ({
      ...tool,
      datetime_log: tool.datetime_log.toISOString(),
    }));

    res.json({
      currentPage: page,
      itemsPerPage: limit,
      totalCount: totalCount,
      comingTools: formattedComingTools,
    });
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
    res.status(500).send('Ошибка при получении данных');
  }
}

async function getComingToolDates(req, res) {
  try {
    const query = `SELECT DISTINCT CAST(datetime_log AS DATE) AS date
                   FROM dbo.vue_log
                   WHERE message LIKE '%Добавлен%'
                      OR (message LIKE '%Обновлен%' AND new_amount > old_amount)
                   ORDER BY date DESC`;
    const result = await pool.query(query);

    const dates = result.rows.map(row => {
      const year = row.date.getFullYear();
      const month = ('0' + (row.date.getMonth() + 1)).slice(-2); // Месяцы начинаются с 0
      const day = ('0' + row.date.getDate()).slice(-2);
      return `${year}-${month}-${day}`;
    });

    console.log(dates); // Проверьте консоль на корректность формата
    res.json(dates);
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
    res.status(500).send('Ошибка при получении данных');
  }
}

module.exports = {
  getComingTool,
  getComingToolDates,
};
