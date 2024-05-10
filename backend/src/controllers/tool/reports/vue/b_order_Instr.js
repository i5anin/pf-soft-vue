const { Pool } = require('pg')
const getDbConfig = require('../../../../databaseConfig')

// Настройка подключения к базе данных

const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

async function getTableReportData(req, res) {
  try {
    const query = `WITH RECURSIVE
                     TreePath AS (SELECT id,
                                         name,
                                         parent_id,
                                         name AS path -- Начальный путь это просто имя текущей записи
                                  FROM dbo.tool_tree
                                  WHERE parent_id = 1 -- Стартуем с корня иерархии

                                  UNION ALL

                                  SELECT tt.id,
                                         tt.name,
                                         tt.parent_id,
                                         CONCAT(tp.path, ' / ', tt.name) -- Строим путь, добавляя имя текущей записи
                                  FROM dbo.tool_tree tt
                                         JOIN TreePath tp ON tt.parent_id = tp.id
                     ),
                     damaged AS (SELECT tool_nom.id                                     AS id_tool,
                                        tool_nom.parent_id,
                                        tool_nom.group_id,
                                        tool_nom.name,
                                        tool_nom.sklad,
                                        tool_nom.norma,
                                        tool_nom.norma - tool_nom.sklad                 AS zakaz,
                                        COALESCE(SUM(tool_history_damaged.quantity), 0) AS damaged_last_7_days
                                 FROM dbo.tool_nom
                                        LEFT JOIN
                                      dbo.tool_history_damaged ON tool_nom.id = tool_history_damaged.id_tool
                                        AND tool_history_damaged.timestamp >= CURRENT_DATE - INTERVAL '7 days'
                                 WHERE tool_nom.norma IS NOT NULL
                                   AND (tool_nom.norma - tool_nom.sklad) > 0
                                 GROUP BY tool_nom.id,
                                          tool_nom.parent_id,
                                          tool_nom.name,
                                          tool_nom.sklad,
                                          tool_nom.norma,
                                          tool_nom.group_id)
                   SELECT d.parent_id,
                          tp.path,
                          JSON_AGG(
                            JSON_BUILD_OBJECT(
                              'id_tool', d.id_tool,
                              'name', d.name,
                              'group_id', d.group_id,
                              'sklad', d.sklad,
                              'norma', d.norma,
                              'zakaz', d.zakaz,
                              'damaged_last_7_days', d.damaged_last_7_days
                            )
                          ) AS tools
                   FROM damaged d
                          JOIN TreePath tp ON d.parent_id = tp.id
                   GROUP BY d.parent_id, tp.path, d.group_id, d.name
                   ORDER BY tp.path, d.group_id, d.name;`
    const { rows } = await pool.query(query)
    res.json(rows) // Отправляем данные в формате JSON
  } catch (error) {
    console.error('Ошибка при получении данных для таблицы:', error)
    res.status(500).send('Ошибка при получении данных для таблицы')
  }
}

module.exports = {
  getTableReportData,
}
