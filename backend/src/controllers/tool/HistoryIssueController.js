const { Pool } = require('pg')
const getDbConfig = require('../../config/databaseConfig')

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

async function getToolHistoryId(req, res) {
  try {
    const specs_op_id = req.params.id // Изменено на req.params.id
    const query = `
      SELECT sn.NAME,
             sn.description,
             oon.no                                              AS no_oper,
             dbo.get_full_cnc_type(dbo.get_op_type_code(sno.ID)) AS type_oper,
             CAST(sno.id AS INTEGER)                             AS specs_op_id,
             sn.ID,
             thn.quantity,
             thn.id_user,
             thn.id_tool,
             thn.timestamp                                       AS date,
             o.fio                                               AS user_fio,  -- Поле user_fio из таблицы operators
             tn.name                                             AS name_tool, -- Поле name_tool из таблицы tool_nom
             tn.property                                                       -- Поле property из таблицы tool_nom
      FROM dbo.tool_history_nom thn
             LEFT JOIN dbo.specs_nom_operations sno ON thn.specs_op_id = sno.id
             LEFT JOIN dbo.specs_nom sn ON sno.specs_nom_id = sn.id
             LEFT JOIN dbo.operations_ordersnom oon ON oon.op_id = sno.ordersnom_op_id
             LEFT JOIN dbo.operators o ON thn.id_user = o.id
             LEFT JOIN dbo.tool_nom tn ON thn.id_tool = tn.id
      WHERE thn.specs_op_id = $1
        AND NOT sn.status_otgruzka
        AND (POSITION('ЗАПРЕТ' IN UPPER(sn.comments)) = 0 OR sn.comments IS NULL)
      ORDER BY sn.NAME, sn.description, oon.no::INT;
    `
    const result = await pool.query(query, [specs_op_id])

    if (result.rows.length > 0) {
      const groupedData = result.rows.reduce((acc, item) => {
        if (!acc[item.id_tool]) {
          acc[item.id_tool] = { data: [], totalQuantity: 0 }
        }
        acc[item.id_tool].data.push({ ...item, type: 'position' })
        acc[item.id_tool].totalQuantity += item.quantity
        return acc
      }, {})

      const finalData = []
      Object.values(groupedData).forEach((group) => {
        finalData.push(...group.data)
        finalData.push({
          name: group.data[0].name,
          description: group.data[0].description,
          no_oper: group.data[0].no_oper,
          type_oper: group.data[0].type_oper,
          specs_op_id: group.data[0].specs_op_id,
          id: group.data[0].id,
          quantity: group.totalQuantity,
          id_user: null,
          id_tool: group.data[0].id_tool,
          date: '',
          user_fio: '',
          name_tool: group.data[0].name_tool,
          type: 'sum',
        })
      })

      res.status(200).json(finalData)
    } else {
      res.status(404).send('История для данного ID операции не найдена.')
    }
  } catch (err) {
    console.error('Ошибка при запросе истории инструмента:', err)
    res.status(500).send('Ошибка сервера')
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
    res.json(result.rows.map((row) => ({ id_tool: row.id_tool, name: row.name })))
  } catch (err) {
    console.error('Ошибка при получении идентификаторов инструмента:', err)
    res.status(500).send('Ошибка сервера')
  }
}

async function getToolMovementById(req, res) {
  const toolId = req.params.id // Получаем id инструмента из параметров запроса

  try {
    const query = `
      SELECT "l".id     AS log_id,
             "l".message,
             "l".datetime_log,
             "l".new_amount,
             "l".old_amount,
             "tn".name  AS tool_name,
             "vu".login AS user_login,
             "tn".id    AS tool_nom_id,
             "vu".id    AS vue_users_id
      FROM "dbo"."vue_log" "l"
             LEFT JOIN "dbo"."tool_nom" "tn" ON "l".tool_id = "tn".id
             LEFT JOIN "dbo"."vue_users" "vu" ON "l".user_id = "vu".id
      WHERE "l".tool_id = $1
      ORDER BY "l".datetime_log DESC;
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
  getToolHistoryId,
  getAllIssuedToolIdsWithNames,
  getToolMovementById,
}
