// Импорт зависимостей
const { Pool } = require('pg')
const getDbConfig = require('../../../config/databaseConfig') // Убедитесь, что путь правильный!

const dbConfig = getDbConfig()
// Создание пула подключений к БД
const pool = new Pool(dbConfig)

async function getGroupedTools(req, res) {
  try {
    const query = `
      WITH RECURSIVE
        TreePath AS (SELECT id, name, parent_id, CAST(name AS TEXT) as path
                     FROM dbo.tool_tree
                     WHERE parent_id = 1

                     UNION ALL

                     SELECT tt.id, tt.name, tt.parent_id, CONCAT(tp.path, ' / ', tt.name) AS path
                     FROM dbo.tool_tree tt
                            JOIN TreePath tp ON tt.parent_id = tp.id),
        ToolsWithPath AS (SELECT tn.id,
                                 tn.name,
                                 tn.sklad,
                                 tn.norma,
                                 tn.property,
                                 tn.parent_id,
                                 tn.group_id,
                                 tn.group_standard,
                                 tp.path
                          FROM dbo.tool_nom tn
                                 JOIN TreePath tp ON tn.parent_id = tp.id
                          WHERE tn.group_id IS NOT NULL
                            AND tn.group_id <> 0)
      SELECT *
      FROM ToolsWithPath
      ORDER BY group_id, group_standard DESC NULLS LAST, name;
    `

    const { rows } = await pool.query(query)

    const groupedTools = rows.reduce((acc, tool) => {
      const groupId = tool.group_id
      if (!acc[groupId]) {
        acc[groupId] = []
      }
      acc[groupId].push({
        id: tool.id,
        name: tool.name,
        sklad: tool.sklad,
        norma: tool.norma,
        property: tool.property,
        parent_id: tool.parent_id,
        group_id: tool.group_id,
        group_standard: tool.group_standard,
        path: tool.path,
      })
      return acc
    }, {})

    res.json(groupedTools)
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
    res.status(500).json({ error: 'Произошла ошибка' })
  }
}

module.exports = { getGroupedTools }
