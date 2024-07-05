const { Pool } = require('pg')
const getDbConfig = require('../../config/databaseConfig')

// Получение настроек для подключения к базе данных
const dbConfig = getDbConfig()
// Создание соединения с базой данных
const pool = new Pool(dbConfig)

async function getToolHistoryByPartIdInfo(req, res) {
  try {
    const idPart = req.query.id_part
    const selectedDate = req.query.selectedDate

    let operationsQuery = `
      SELECT sn.ID AS id_part,
             sn.NAME,
             sn.description,
             oon.no AS no_oper,
             sno.status_ready AS operation_ready,
             sno.id AS specs_op_id,
             thn.id AS tool_history_id,
             COALESCE(tpa.archive, false) AS is_archive
      FROM dbo.specs_nom sn
      LEFT JOIN dbo.specs_nom_operations sno ON sn.id = sno.specs_nom_id
      LEFT JOIN dbo.operations_ordersnom oon ON sno.ordersnom_op_id = oon.op_id
      LEFT JOIN dbo.tool_history_nom thn ON sno.id = thn.specs_op_id AND thn.timestamp >= $2::date AND thn.timestamp < $2::date + interval '1 day'
      LEFT JOIN dbo.tool_part_archive tpa ON sn.id = tpa.specs_nom_id
      WHERE sn.ID = $1 AND (T OR tf OR f OR f4 OR fg OR dmc OR hision)
      ORDER BY oon.no;
    `

    const queryParams = [idPart]
    if (selectedDate) {
      queryParams.push(selectedDate)
    } else {
      // If not provided, default to current date
      queryParams.push(new Date())
    }

    const operationsResult = await pool.query(operationsQuery, queryParams)

    if (operationsResult.rows.length === 0) {
      return res.status(404).send('Операции для данной партии не найдены')
    }

    let info = {
      id_part: idPart,
      name: '',
      description: '',
      operations: [],
      completed_operations: [],
      is_archive: false, // Добавляем сюда по умолчанию false
    }

    const operations = new Set()
    const completed_operations = new Set()

    operationsResult.rows.forEach((row) => {
      operations.add(row.no_oper)
      if (row.operation_ready) {
        completed_operations.add(row.no_oper)
      }

      // Update part info if not set
      if (!info.name) {
        info.name = row.name
        info.description = row.description
        info.is_archive = row.is_archive // Обновляем статус архива
      }
    })

    info.operations = Array.from(operations).sort()
    info.completed_operations = Array.from(completed_operations).sort()

    res.json({ info })
  } catch (err) {
    console.error('Error executing query', err.stack)
    res.status(500).send('Ошибка при выполнении запроса')
  }
}

async function getToolHistoryByPartId(req, res) {
  try {
    const idPart = req.query.id_part
    const selectedDate = req.query.selectedDate // Получаем выбранную дату из параметров запроса

    let operationsQuery = `
      SELECT thn.id,
             sno.id AS specs_op_id,
             sn.ID AS id_part,
             sn.NAME,
             sn.description,
             oon.no AS no_oper,
             dbo.get_full_cnc_type(dbo.get_op_type_code(sno.ID)) AS type_oper,
             thn.quantity,
             CASE
               WHEN thn.id_user < 0 THEN (SELECT name FROM dbo.tool_user_custom_list WHERE -id = thn.id_user)
               ELSE o.fio
               END AS user_fio,
             thn.id_user,
             thn.timestamp,
             tn.name AS name_tool,
             thn.id_tool,
             thn.type_issue,
             thn.comment,
             thn.cancelled,
             thn.issuer_id,
             vu.login AS issuer_fio,
             vu2.login AS canceller_login,
             sno.status_ready AS operation_ready,
             tn.sklad AS current_stock
      FROM dbo.tool_history_nom thn
      LEFT JOIN dbo.specs_nom_operations sno ON thn.specs_op_id = sno.id
      LEFT JOIN dbo.specs_nom sn ON sno.specs_nom_id = sn.id
      LEFT JOIN dbo.operations_ordersnom oon ON oon.op_id = sno.ordersnom_op_id
      LEFT JOIN dbo.operators o ON thn.id_user = o.id
      LEFT JOIN dbo.tool_nom tn ON thn.id_tool = tn.id
      LEFT JOIN dbo.vue_users vu ON thn.issuer_id = vu.id
      LEFT JOIN dbo.vue_users vu2 ON thn.cancelled_id = vu2.id
      WHERE sn.ID = $1
    `

    const queryParams = [idPart]

    if (selectedDate) {
      operationsQuery += ` AND thn.timestamp >= $2::date AND thn.timestamp < $2::date + interval '1 day'`
      queryParams.push(selectedDate)
    }

    operationsQuery += ' ORDER BY thn.timestamp DESC;'

    const operationsResult = await pool.query(operationsQuery, queryParams)

    if (operationsResult.rows.length === 0)
      return res.status(404).send('Операции для данной партии не найдены')

    const allTools = {}
    const operationsData = {}

    operationsResult.rows.forEach((row) => {
      const typeIssueMap = {
        0: 'Себе',
        1: 'На ночь',
        2: 'Наладка',
      }
      row.type_issue = typeIssueMap[row.type_issue] || 'Неизвестно'

      if (allTools[row.id_tool]) {
        allTools[row.id_tool].quantity += row.quantity
        if (new Date(allTools[row.id_tool].timestamp) < new Date(row.timestamp)) {
          allTools[row.id_tool].timestamp = row.timestamp
          allTools[row.id_tool].type_issue = row.type_issue
        }
      } else {
        allTools[row.id_tool] = {
          type_oper: row.type_oper,
          quantity: row.quantity,
          timestamp: row.timestamp,
          name_tool: row.name_tool,
          id_tool: row.id_tool,
          type_issue: row.type_issue,
        }
      }

      if (!operationsData[row.no_oper]) {
        operationsData[row.no_oper] = []
      }

      operationsData[row.no_oper].push({
        id: row.id,
        specs_op_id: Number(row.specs_op_id),
        no_oper: row.no_oper,
        type_oper: row.type_oper,
        quantity: row.quantity,
        user_fio: row.user_fio,
        id_user: row.id_user,
        timestamp: row.timestamp,
        name_tool: row.name_tool,
        id_tool: row.id_tool,
        type_issue: row.type_issue,
        comment: row.comment,
        cancelled: row.cancelled,
        issuer_fio: row.issuer_fio,
        issuer_id: row.issuer_id,
        canceller_login: row.canceller_login, // Displaying canceller's login
        operation_ready: row.operation_ready, // Adding operation readiness status
        current_stock: row.current_stock, // Добавляем текущее количество на складе
      })
    })

    // Обновленная сортировка: сначала по дате, затем по имени инструмента
    Object.keys(operationsData).forEach((no_oper) => {
      operationsData[no_oper].sort((a, b) => {
        return (
          new Date(b.timestamp) - new Date(a.timestamp) || a.name_tool.localeCompare(b.name_tool)
        )
      })
    })

    const finalData = {
      all: Object.values(allTools),
    }

    Object.keys(operationsData)
      .sort()
      .forEach((operation) => {
        finalData[operation] = operationsData[operation]
      })

    res.json(finalData)
  } catch (err) {
    console.error('Error executing query', err.stack)
    res.status(500).send('Ошибка при выполнении запроса')
  }
}

async function getToolHistoryByOperationId(req, res) {
  try {
    const idOperation = req.query.operationId // Исправлено: используем operationId
    const selectedDate = req.query.selectedDate // Получаем выбранную дату из параметров запроса

    let operationsQuery = `
   SELECT thn.id,
       sno.id AS specs_op_id,
       sn.ID AS id_part,
       sn.NAME,
       sn.description,
       oon.no AS no_oper,
       dbo.get_full_cnc_type(dbo.get_op_type_code(sno.ID)) AS type_oper,
       thn.quantity,
       CASE
         WHEN thn.id_user < 0 THEN (SELECT name FROM dbo.tool_user_custom_list WHERE -id = thn.id_user)
         ELSE o.fio
       END AS user_fio,
       thn.id_user,
       thn.timestamp,
       tn.name AS name_tool,
       thn.id_tool,
       thn.type_issue,
       thn.comment,
       thn.cancelled,
       thn.issuer_id,
       vu.login AS issuer_fio,
       vu2.login AS canceller_login,
       sno.status_ready AS operation_ready,
       tn.sklad AS current_stock
FROM dbo.tool_history_nom thn
LEFT JOIN dbo.specs_nom_operations sno ON thn.specs_op_id = sno.id
LEFT JOIN dbo.specs_nom sn ON sno.specs_nom_id = sn.id
LEFT JOIN dbo.operations_ordersnom oon ON oon.op_id = sno.ordersnom_op_id
LEFT JOIN dbo.operators o ON thn.id_user = o.id
LEFT JOIN dbo.tool_nom tn ON thn.id_tool = tn.id
LEFT JOIN dbo.vue_users vu ON thn.issuer_id = vu.id
LEFT JOIN dbo.vue_users vu2 ON thn.cancelled_id = vu2.id
WHERE thn.specs_op_id =  $1
    `
    const queryParams = [idOperation]

    if (selectedDate) {
      operationsQuery += ` AND thn.timestamp >= $2::date AND thn.timestamp < $2::date + interval '1 day'`
      queryParams.push(selectedDate)
    }

    operationsQuery += ' ORDER BY thn.timestamp DESC;'

    const operationsResult = await pool.query(operationsQuery, queryParams)

    if (operationsResult.rows.length === 0) {
      return res.status(404).json({ message: 'Операции для данной операции не найдены' })
    }

    const operationsData = operationsResult.rows.map((row) => {
      const typeIssueMap = {
        0: 'Себе',
        1: 'На ночь',
        2: 'Наладка',
      }
      return {
        id: row.id,
        specs_op_id: Number(row.specs_op_id),
        no_oper: row.no_oper,
        type_oper: row.type_oper,
        quantity: row.quantity,
        user_fio: row.user_fio,
        id_user: row.id_user,
        timestamp: row.timestamp,
        name_tool: row.name_tool,
        id_tool: row.id_tool,
        type_issue: typeIssueMap[row.type_issue] || 'Неизвестно',
        comment: row.comment,
        cancelled: row.cancelled,
        issuer_fio: row.issuer_fio,
        issuer_id: row.issuer_id,
        canceller_login: row.canceller_login,
        operation_ready: row.operation_ready,
        current_stock: row.current_stock,
      }
    })

    res.json(operationsData)
  } catch (err) {
    console.error('Error executing query', err.stack)
    res.status(500).send('Ошибка при выполнении запроса')
  }
}

async function addToArchive(req, res) {
  const client = await pool.connect()
  try {
    const { id_part: idPart, archive: newArchiveState, token } = req.body

    // Проверяем пользователя и его роль
    const userRoleQuery = 'SELECT role FROM dbo.vue_users WHERE token = $1'
    const userRoleResult = await client.query(userRoleQuery, [token])

    if (
      userRoleResult.rows.length === 0 ||
      !(userRoleResult.rows[0].role === 'Editor' || userRoleResult.rows[0].role === 'Admin')
    ) {
      return res.status(403).send('Доступ запрещен. Требуется роль Editor или Admin.')
    }

    // Проверка на существование записи
    const checkExistsQuery = `
      SELECT id
      FROM dbo.tool_part_archive
      WHERE specs_nom_id = $1;
    `
    const checkExistsResult = await client.query(checkExistsQuery, [idPart])

    if (checkExistsResult.rows.length > 0) {
      // Обновляем флаг
      const updateQuery = `
        UPDATE dbo.tool_part_archive
        SET archive = $2
        WHERE specs_nom_id = $1;
      `
      await client.query(updateQuery, [idPart, newArchiveState])
    } else {
      // Создаем запись
      const insertQuery = `
        INSERT INTO dbo.tool_part_archive (specs_nom_id, archive)
        VALUES ($1, $2);
      `
      await client.query(insertQuery, [idPart, newArchiveState])
    }

    await client.query('COMMIT')
    res.send(newArchiveState ? 'Запись добавлена в архив.' : 'Запись удалена из архива.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Ошибка при изменении архивного состояния', err.stack)
    res.status(500).send('Ошибка при изменении архивного состояния.')
  } finally {
    client.release()
  }
}

module.exports = {
  getToolHistoryByOperationId,
  getToolHistoryByPartId,
  getToolHistoryByPartIdInfo,
  addToArchive,
}
