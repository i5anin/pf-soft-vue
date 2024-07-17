const { Pool } = require('pg')
const getDbConfig = require('../../config/databaseConfig')

// Получение настроек для подключения к базе данных
const dbConfig = getDbConfig()

// Создание соединения с базой данных
const pool = new Pool(dbConfig)

async function getFioOperators(req, res) {
  try {
    const query = `
      SELECT 'operator' AS type, id, fio
      FROM dbo.operators
      WHERE not nach
        AND not nalad
        AND active
      UNION ALL
      SELECT 'custom_list' AS type, -id AS id, name AS fio
      FROM dbo.tool_user_custom_list
      ORDER BY fio
    `

    // Выполнение запроса
    const result = await pool.query(query)

    // Проверка наличия результатов и их отправка
    if (result.rows && result.rows.length > 0) {
      res.json(result.rows)
    } else {
      res.status(404).send('Операторы и кастомные списки не найдены')
    }
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error)
    res.status(500).send('Внутренняя ошибка сервера')
  }
}

// Функция для выполнения операции выдачи инструмента
async function issueTool(req, res) {
  const { specs_op_id, id_user, id_tool, type_issue, quantity, issueToken } =
    req.body

  if (
    !specs_op_id ||
    !id_user ||
    !id_tool ||
    quantity == null ||
    type_issue == null ||
    !issueToken
  ) {
    return res.status(400).json({
      success: false,
      message: 'Отсутствует один из обязательных параметров',
    })
  }

  try {
    const issuerIdResult = await pool.query(
      'SELECT id FROM dbo.vue_users WHERE token = $1',
      [issueToken]
    )
    if (issuerIdResult.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: 'Неверный токен доступа' })
    }
    const issuerId = issuerIdResult.rows[0].id

    const toolData = await pool.query(
      'SELECT sklad FROM dbo.tool_nom WHERE id = $1',
      [id_tool]
    )
    if (toolData.rows.length === 0 || toolData.rows[0].sklad < quantity) {
      return res
        .status(400)
        .json({ success: false, message: 'Недостаточно инструмента на складе' })
    }

    const insertResult = await pool.query(
      `INSERT INTO dbo.tool_history_nom (specs_op_id, id_user, id_tool, type_issue, quantity, timestamp, issuer_id)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
       RETURNING id, timestamp;`,
      [specs_op_id, id_user, id_tool, type_issue, quantity, issuerId]
    )

    await pool.query('UPDATE dbo.tool_nom SET sklad = sklad - $1 WHERE id = $2', [
      quantity,
      id_tool,
    ])

    res.status(200).json({
      success: true,
      message: 'Инструменты успешно выданы',
      data: {
        insertedRecordId: insertResult.rows[0].id,
        timestamp: insertResult.rows[0].timestamp,
        specs_op_id,
        id_user,
        id_tool,
        type_issue,
        quantity,
        issuerId,
      },
    })
  } catch (error) {
    console.error('Ошибка при выдаче инструмента:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      errorDetails: error.message,
    })
  }
}

async function issueTools(req, res) {
  const { operationId, userId, tools, typeIssue, issueToken } = req.body

  if (!issueToken) return res.status(401).send('Authentication token is required.')

  try {
    await pool.query('BEGIN')

    const tokenQuery = 'SELECT id FROM dbo.vue_users WHERE token = $1'
    const tokenResult = await pool.query(tokenQuery, [issueToken])

    if (tokenResult.rows.length === 0) {
      await pool.query('ROLLBACK')
      return res.status(403).send('Invalid token.')
    }

    const issuerId = tokenResult.rows[0].id

    const insufficientTools = []

    for (const { toolId, quantity } of tools) {
      const selectQuery = 'SELECT sklad FROM dbo.tool_nom WHERE id = $1'
      const stockResult = await pool.query(selectQuery, [toolId])

      if (stockResult.rows.length === 0 || stockResult.rows[0].sklad < quantity) {
        insufficientTools.push({
          toolId,
          available: stockResult.rows[0]?.sklad || 0,
          requested: quantity,
        })
      }
    }

    if (insufficientTools.length > 0) {
      await pool.query('ROLLBACK')
      return res.status(404).json({
        success: false,
        message: 'Недостаточно инструментов на складе.',
        insufficientTools,
      })
    }

    for (const { toolId, quantity } of tools) {
      const selectQuery = 'SELECT sklad FROM dbo.tool_nom WHERE id = $1'
      const stockResult = await pool.query(selectQuery, [toolId])

      const newStock = stockResult.rows[0].sklad - quantity
      const oldStock = stockResult.rows[0].sklad

      const getPartIdQuery = `
        SELECT specs_nom_id
        FROM dbo.specs_nom_operations
        WHERE id = $1
      `
      const partIdResult = await pool.query(getPartIdQuery, [operationId])

      if (partIdResult.rows.length === 0) {
        await pool.query('ROLLBACK')
        return res.status(404).send('Operation not found.')
      }

      const partId = partIdResult.rows[0].specs_nom_id

      const insertQuery = `
        INSERT INTO dbo.tool_history_nom (specs_op_id, id_user, id_tool, type_issue, quantity, timestamp, issuer_id,
                                          specs_nom_id)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7)
      `
      await pool.query(insertQuery, [
        operationId,
        userId,
        toolId,
        typeIssue,
        quantity,
        issuerId,
        partId,
      ])

      const updateQuery = 'UPDATE dbo.tool_nom SET sklad = $1 WHERE id = $2'
      await pool.query(updateQuery, [newStock, toolId])

      const logMessage = `Выдача инструмента ${toolId}: ${quantity} ед. Пользователь: ${userId}, Осталось на складе: ${newStock}.`
      const logQuery =
        'INSERT INTO dbo.vue_log (message, tool_id, user_id, datetime_log, old_amount, new_amount) VALUES ($1, $2, $3, NOW(), $4, $5)'
      await pool.query(logQuery, [logMessage, toolId, issuerId, oldStock, newStock])
    }

    await pool.query('COMMIT')
    res.json({ success: 'OK', message: 'Инструменты успешно выданы' })
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('Ошибка при выдаче инструмента:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Please contact the administrator.',
    })
  }
}

async function getCncData(req, res) {
  try {
    const query = `
      SELECT id, cnc_name, cnc_code
      FROM dbo.cnc
      WHERE active = 't'
      ORDER BY cnc_name
    `

    const result = await pool.query(query)

    if (result.rows.length > 0) {
      res.json(result.rows)
    } else {
      res.status(404).send('Станки не найдены')
    }
  } catch (error) {
    console.error('Ошибка при получении данных о станках:', error)
    res.status(500).send('Внутренняя ошибка сервера')
  }
}

async function cancelOperationAdmin(req, res) {
  const { id } = req.params // The operation ID
  const { issueToken, cancelQuantity } = req.body // Token and cancellation quantity passed in the request body

  if (!id) {
    return res.status(400).send('Отсутствует обязательный параметр: id операции')
  }

  if (!issueToken) {
    return res.status(401).send('Authentication token is required.')
  }

  if (!cancelQuantity || cancelQuantity <= 0) {
    return res.status(400).send('Укажите корректное количество для отмены.')
  }

  const userValidationQuery = 'SELECT id FROM dbo.vue_users WHERE token = $1'
  const userResult = await pool.query(userValidationQuery, [issueToken])

  if (userResult.rows.length === 0) {
    return res.status(403).send('Invalid token.')
  }

  const issuerId = userResult.rows[0].id // ID of the user who initiated the cancellation

  try {
    await pool.query('BEGIN')

    const operationQuery =
      'SELECT id, id_tool, quantity, cancelled, timestamp FROM dbo.tool_history_nom WHERE id = $1'
    const operation = await pool.query(operationQuery, [id])

    if (operation.rows.length === 0) {
      await pool.query('ROLLBACK')
      return res.status(404).send('Операция не найдена')
    }

    if (operation.rows[0].cancelled) {
      await pool.query('ROLLBACK')
      return res.status(400).send('Операция уже была отменена')
    }

    if (cancelQuantity > operation.rows[0].quantity) {
      await pool.query('ROLLBACK')
      return res.status(400).send('Количество для отмены превышает доступное.')
    }

    const stockQuery = `SELECT sklad
                        FROM dbo.tool_nom
                        WHERE id = $1`
    const stockResult = await pool.query(stockQuery, [operation.rows[0].id_tool])
    const oldQuantity = parseInt(stockResult.rows[0].sklad, 10)

    const currentDate = new Date()
    const operationDate = new Date(operation.rows[0].timestamp)
    const differenceInDays = Math.floor(
      (currentDate - operationDate) / (1000 * 60 * 60 * 24)
    )

    if (differenceInDays > 50) {
      await pool.query('ROLLBACK')
      return res
        .status(403)
        .send(
          'Отмена операции возможна только в течение 3 дней с момента выполнения.'
        )
    }

    const updateOperationQuery = `UPDATE dbo.tool_history_nom
                                  SET quantity     = quantity - $2,
                                      cancelled    = true,
                                      cancelled_id = $3
                                  WHERE id = $1`
    await pool.query(updateOperationQuery, [id, cancelQuantity, issuerId])

    const newQuantity = oldQuantity + parseInt(cancelQuantity, 10)

    const updateStockQuery = `UPDATE dbo.tool_nom
                              SET sklad = $1
                              WHERE id = $2`
    await pool.query(updateStockQuery, [newQuantity, operation.rows[0].id_tool])

    // Логирование операции возврата
    const logMessage = `Отмена операции ${id}: ${cancelQuantity} ед. возвращено на склад. Было: ${oldQuantity}, стало: ${newQuantity}.`
    const logQuery = `INSERT INTO dbo.vue_log (message, tool_id, user_id, datetime_log, old_amount, new_amount)
                      VALUES ($1, $2, $3, NOW(), $4, $5)`
    await pool.query(logQuery, [
      logMessage,
      operation.rows[0].id_tool,
      issuerId,
      oldQuantity,
      newQuantity,
    ])

    await pool.query('COMMIT')

    res.status(200).json({
      success: true,
      message: 'Операция успешно отменена',
      operationId: id,
      details: {
        toolId: operation.rows[0].id_tool,
        quantityReturned: cancelQuantity,
        stockUpdated: `Было ${oldQuantity}, стало ${newQuantity} на складе.`,
      },
    })
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('Ошибка при отмене операции:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      errorDetails: error.message,
    })
  }
}

async function cancelOperation(req, res) {
  const { id } = req.params // The operation ID
  const { issueToken, cancelQuantity } = req.body // Token and cancellation quantity passed in the request body

  if (!id) {
    return res.status(400).send('Отсутствует обязательный параметр: id операции')
  }

  if (!issueToken) {
    return res.status(401).send('Authentication token is required.')
  }

  if (!cancelQuantity || cancelQuantity <= 0) {
    return res.status(400).send('Укажите корректное количество для отмены.')
  }

  const userValidationQuery = 'SELECT id FROM dbo.vue_users WHERE token = $1'
  const userResult = await pool.query(userValidationQuery, [issueToken])

  if (userResult.rows.length === 0) {
    return res.status(403).send('Invalid token.')
  }

  const issuerId = userResult.rows[0].id // ID of the user who initiated the cancellation

  try {
    await pool.query('BEGIN')

    const operationQuery =
      'SELECT id, id_tool, quantity, cancelled, timestamp FROM dbo.tool_history_nom WHERE id = $1'
    const operation = await pool.query(operationQuery, [id])

    if (operation.rows.length === 0) {
      await pool.query('ROLLBACK')
      return res.status(404).send('Операция не найдена')
    }

    if (operation.rows[0].cancelled) {
      await pool.query('ROLLBACK')
      return res.status(400).send('Операция уже была отменена')
    }

    if (cancelQuantity > operation.rows[0].quantity) {
      await pool.query('ROLLBACK')
      return res.status(400).send('Количество для отмены превышает доступное.')
    }

    const stockQuery = `SELECT sklad
                        FROM dbo.tool_nom
                        WHERE id = $1`
    const stockResult = await pool.query(stockQuery, [operation.rows[0].id_tool])
    const oldQuantity = parseInt(stockResult.rows[0].sklad, 10)

    const currentDate = new Date()
    const operationDate = new Date(operation.rows[0].timestamp)
    const differenceInDays = Math.floor(
      (currentDate - operationDate) / (1000 * 60 * 60 * 24)
    )

    if (differenceInDays > 3) {
      await pool.query('ROLLBACK')
      return res
        .status(403)
        .send(
          'Отмена операции возможна только в течение 3 дней с момента выполнения.'
        )
    }

    const updateOperationQuery = `UPDATE dbo.tool_history_nom
                                  SET quantity     = quantity - $2,
                                      cancelled    = true,
                                      cancelled_id = $3
                                  WHERE id = $1`
    await pool.query(updateOperationQuery, [id, cancelQuantity, issuerId])

    const newQuantity = oldQuantity + parseInt(cancelQuantity, 10)

    const updateStockQuery = `UPDATE dbo.tool_nom
                              SET sklad = $1
                              WHERE id = $2`
    await pool.query(updateStockQuery, [newQuantity, operation.rows[0].id_tool])

    // Логирование операции возврата
    const logMessage = `Отмена операции ${id}: ${cancelQuantity} ед. возвращено на склад. Было: ${oldQuantity}, стало: ${newQuantity}.`
    const logQuery = `INSERT INTO dbo.vue_log (message, tool_id, user_id, datetime_log, old_amount, new_amount)
                      VALUES ($1, $2, $3, NOW(), $4, $5)`
    await pool.query(logQuery, [
      logMessage,
      operation.rows[0].id_tool,
      issuerId,
      oldQuantity,
      newQuantity,
    ])

    await pool.query('COMMIT')

    res.status(200).json({
      success: true,
      message: 'Операция успешно отменена',
      operationId: id,
      details: {
        toolId: operation.rows[0].id_tool,
        quantityReturned: cancelQuantity,
        stockUpdated: `Было ${oldQuantity}, стало ${newQuantity} на складе.`,
      },
    })
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('Ошибка при отмене операции:', error)
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      errorDetails: error.message,
    })
  }
}

async function findParties(req, res) {
  try {
    const query = `
      SELECT CAST(dbo.specs_nom_operations.id AS INTEGER)                         AS specs_op_id,
             dbo.specs_nom.ID,
             dbo.specs_nom.NAME,
             dbo.specs_nom.description,
             operations_ordersnom.no,
             dbo.get_full_cnc_type(dbo.get_op_type_code(specs_nom_operations.ID)) as cnc_type
      FROM dbo.specs_nom
             INNER JOIN dbo.specs_nom_operations ON specs_nom_operations.specs_nom_id = specs_nom.id
             INNER JOIN dbo.operations_ordersnom ON operations_ordersnom.op_id = specs_nom_operations.ordersnom_op_id
      WHERE CAST(dbo.specs_nom.ID AS TEXT) LIKE $1
        AND specs_nom.status_p = 'П'
        AND NOT specs_nom.status_otgruzka
        AND (POSITION('ЗАПРЕТ' IN UPPER(specs_nom.comments)) = 0 OR specs_nom.comments IS NULL)
        AND (T OR dmc OR hision OR f OR f4 OR fg OR tf)
      ORDER BY dbo.specs_nom.NAME,
               dbo.specs_nom.description,
               operations_ordersnom.no::INT
    `
    const result = await pool.query(query, [req.query.id + '%'])
    res.json(result.rows)
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error)
    res.status(500).send('Внутренняя ошибка сервера')
  }
}

module.exports = {
  findParties,
  cancelOperation,
  cancelOperationAdmin,
  issueTool,
  issueTools,
  getFioOperators,
  getCncData,
}
