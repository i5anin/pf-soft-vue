const { Pool } = require('pg')
const getDbConfig = require('../../../config/databaseConfig')

const dbConfig = getDbConfig()
// Создание соединения с базой данных
const pool = new Pool(dbConfig)

async function getToolHistory(req, res) {
  try {
    const page = parseInt(req.query.page || 1, 10)
    const limit = parseInt(req.query.limit || 15, 10)
    const offset = (page - 1) * limit
    const search = req.query.search
    const date = req.query.date // Получаем дату из запроса
    const toolId = req.query.toolId // Получаем идентификатор инструмента из запроса
    const showArchive = req.query.showArchive === 'true' // Получаем флаг показа архива

    let whereStatement = 'WHERE TRUE'

    if (search) {
      whereStatement += ` AND (
        specs_nom.ID::text LIKE '%${search}%' OR
        UPPER(specs_nom.NAME) LIKE UPPER('%${search}%') OR
        UPPER(specs_nom.description) LIKE UPPER('%${search}%')
      )`
    }

    if (date) {
      whereStatement += ` AND (CAST(tool_history_nom.timestamp AS DATE) = CAST('${date}' AS DATE))`
    }

    // Добавлено условие в WHERE
    whereStatement += ` AND (T OR tf OR f OR f4 OR fg OR dmc OR hision)`

    if (toolId) {
      whereStatement += ` AND (tool_history_nom.id_tool = ${toolId})`
    }

    // Добавляем условие для показа архива
    // Показываем только данные из архива, если флаг `showArchive` равен true
    if (showArchive) {
      whereStatement += ` AND (dbo.tool_part_archive.specs_nom_id IS NOT NULL AND dbo.tool_part_archive.archive IS TRUE)`
    } else {
      // В противном случае, показываем только данные не из архива
      whereStatement += ` AND (dbo.tool_part_archive.specs_nom_id IS NULL OR dbo.tool_part_archive.archive IS NULL OR dbo.tool_part_archive.archive = FALSE )`
    }

    let orderStatement = `ORDER BY MIN(tool_history_nom.TIMESTAMP) DESC`

    // Запрос данных
    // Мы удаляем подзапрос для подсчета totalCount и используем оконную функцию COUNT() OVER()
    const dataQuery = `
      SELECT specs_nom.ID                                                                             AS id_part,
             specs_nom.NAME,
             specs_nom.description,
             COALESCE(SUM(tool_history_nom.quantity), 0)                                              AS quantity_tool,
             COUNT(DISTINCT specs_nom_operations.ID)                                                  AS operation_count,
             COUNT(DISTINCT specs_nom_operations.ID) FILTER (WHERE specs_nom_operations.status_ready) AS ready_count,
             MIN(tool_history_nom.TIMESTAMP)                                                          AS first_issue_date,
             CAST(dbo.kolvo_prod_ready(specs_nom.ID) AS INTEGER)                                      AS quantity_prod,
             specs_nom.kolvo                                                                          AS quantity_prod_all,
             specs_nom.status_otgruzka,
             dbo.tool_part_archive.archive                                                            AS is_archive,
             COUNT(*) OVER ()                                                                         AS total_count
      FROM dbo.specs_nom
             INNER JOIN dbo.specs_nom_operations ON specs_nom.ID = specs_nom_operations.specs_nom_id
             INNER JOIN dbo.operations_ordersnom ON operations_ordersnom.op_id = specs_nom_operations.ordersnom_op_id
             LEFT JOIN dbo.tool_history_nom ON specs_nom_operations.ID = tool_history_nom.specs_op_id
             LEFT JOIN dbo.tool_part_archive ON specs_nom.ID = dbo.tool_part_archive.specs_nom_id
        ${whereStatement}
      GROUP BY specs_nom.ID, specs_nom.NAME, specs_nom.description, specs_nom.status_otgruzka,
               dbo.tool_part_archive.archive
      HAVING COALESCE(SUM(tool_history_nom.quantity), 0) > 0
        ${orderStatement}
      LIMIT ${limit} OFFSET ${offset};
    `

    const dataResult = await pool.query(dataQuery)

    const totalCount =
      dataResult.rows.length > 0 ? dataResult.rows[0].total_count : 0 // Получаем totalCount из первой записи или устанавливаем 0

    res.json({
      currentPage: page,
      itemsPerPage: limit,
      totalCount: totalCount,
      toolsHistory: dataResult.rows.map((row) => ({
        id_part: row.id_part,
        name: row.name,
        description: row.description,
        quantity_tool: row.quantity_tool,
        operation_count: row.operation_count,
        ready_count: row.ready_count,
        first_issue_date: row.first_issue_date
          ? new Date(row.first_issue_date).toISOString().substring(0, 10)
          : null,
        quantity_prod: row.quantity_prod,
        quantity_prod_all: row.quantity_prod_all,
        status_ready: row.ready_count === row.operation_count,
        status_otgruzka: row.status_otgruzka,
        is_archive: row.is_archive,
      })),
    })
  } catch (err) {
    console.error('Error executing query', err.stack)
    res.status(500).send('Ошибка при выполнении запроса')
  }
}

async function getAllIssuedToolIdsWithNames(req, res) {
  try {
    const query = `
      SELECT DISTINCT thn.id_tool, tn.name
      FROM dbo.tool_history_nom thn
             LEFT JOIN dbo.tool_nom tn ON thn.id_tool = tn.id
      ORDER BY tn.name;
    `
    const result = await pool.query(query)
    res.json(
      result.rows.map((row) => ({ id_tool: row.id_tool, name: row.name }))
    )
  } catch (err) {
    console.error('Ошибка при получении идентификаторов инструмента:', err)
    res.status(500).send('Ошибка сервера')
  }
}

async function getToolMovementById(req, res) {
  const toolId = req.params.id // Получаем id инструмента из параметров запроса

  try {
    const query = `
        SELECT
            vl.id AS log_id,
            vl.message,
            vl.datetime_log,
            vl.new_amount,
            vl.old_amount,
            tn.name AS tool_name,
            vu.login AS user_login,
            thn.specs_nom_id
        FROM dbo.vue_log vl
                 LEFT JOIN dbo.tool_nom tn ON vl.tool_id = tn.id
                 LEFT JOIN dbo.vue_users vu ON vl.user_id = vu.id
                 LEFT JOIN dbo.tool_history_nom thn
                           ON vl.tool_id = thn.id_tool
                               AND vl.datetime_log = thn."timestamp" -- Связь по времени выдачи
                               AND vu.id = thn.issuer_id -- Связь по ID того, кто выдал
        WHERE vl.tool_id = $1
          AND vl.new_amount <> vl.old_amount
        ORDER BY vl.datetime_log DESC
        LIMIT 60;
    `

    const result = await pool.query(query, [toolId])

    if (result.rows.length > 0) {
      res.status(200).json(
        result.rows.map((row) => ({
          log_id: row.log_id,
          message: row.message,
          datetime_log: row.datetime_log,
          new_amount: row.new_amount,
          old_amount: row.old_amount,
          tool_name: row.tool_name,
          user_login: row.user_login,
          tool_nom_id: row.tool_nom_id,
          vue_users_id: row.vue_users_id,
          specs_nom_id: row.specs_nom_id,
        }))
      )
    } else {
      res.status(404).send('Движение для данного инструмента не найдено.')
    }
  } catch (err) {
    console.error('Ошибка при запросе движения инструмента:', err)
    res.status(500).send('Ошибка сервера')
  }
}

module.exports = {
  getToolHistory,
  getAllIssuedToolIdsWithNames,
  getToolMovementById,
}
