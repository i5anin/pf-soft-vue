const { Pool } = require('pg')
const getDbConfig = require('../../../config/databaseConfig')

// Настройка подключения к базе данных

const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

async function getTableReportData(req, res) {
  try {
    const today = new Date()
    const thisThursday = new Date(today)
    thisThursday.setDate(thisThursday.getDate() - ((thisThursday.getDay() + 3) % 7))
    const nextThursday = new Date(thisThursday)
    nextThursday.setDate(nextThursday.getDate() + 7)

    const startDate = thisThursday.toISOString().split('T')[0]
    const endDate = nextThursday.toISOString().split('T')[0]

    const query = `WITH RECURSIVE
                     TreePath AS (SELECT id,
                                         name,
                                         parent_id,
                                         name AS path
                                  FROM dbo.tool_tree
                                  WHERE parent_id = 1

                                  UNION ALL

                                  SELECT tt.id,
                                         tt.name,
                                         tt.parent_id,
                                         CONCAT(tp.path, ' / ', tt.name)
                                  FROM dbo.tool_tree tt
                                         JOIN TreePath tp ON tt.parent_id = tp.id
                     ),
                     last_week_tool_history AS (
                       SELECT thn.id_tool,
                              sum(thn.quantity) as quantity,
                              tnom.parent_id,
                              tnom.name,
                              MIN(thn.timestamp) as date_start,
                              MAX(thn.timestamp) as date_end
                       FROM dbo.tool_history_nom thn
                              JOIN dbo.tool_nom tnom ON thn.id_tool = tnom.id
                       WHERE thn.timestamp BETWEEN '${startDate}'::date AND '${endDate}'::date
                         AND thn.quantity > 0
                       GROUP BY thn.id_tool, tnom.parent_id, tnom.name
                     )
                   SELECT lwt.parent_id,
                          tp.path,
                          JSON_AGG(
                            JSON_BUILD_OBJECT(
                              'name', lwt.name,
                              'quantity', lwt.quantity,
                              'date_start', lwt.date_start,
                              'date_end', lwt.date_end
                            )
                            ORDER BY lwt.name
                          ) AS tools
                   FROM last_week_tool_history lwt
                          JOIN TreePath tp ON lwt.parent_id = tp.id
                   GROUP BY lwt.parent_id, tp.path
                   ORDER BY tp.path;`

    const { rows } = await pool.query(query)
    res.json(rows)
  } catch (error) {
    console.error('Ошибка при получении данных для таблицы:', error)
    res.status(500).send('Ошибка при получении данных для таблицы')
  }
}

module.exports = {
  getTableReportData,
}
