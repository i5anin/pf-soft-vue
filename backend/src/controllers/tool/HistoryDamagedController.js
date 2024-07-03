const { Pool } = require('pg')
const getDbConfig = require('../../config/databaseConfig')

const dbConfig = getDbConfig()
// Создание пула соединений с базой данных
const pool = new Pool(dbConfig)

// Экспорт функции для получения дерева инструментов

async function getDamaged(req, res) {
  try {
    const page = parseInt(req.query.page || 1, 10)
    const limit = parseInt(req.query.limit || 15, 10)
    const offset = (page - 1) * limit

    // Запрос для подсчета общего количества уникальных id
    const countQuery = `
      SELECT COUNT(DISTINCT id)
      FROM dbo.tool_history_damaged;
    `

    // Запрос для получения агрегированных данных истории повреждений
    const dataQuery = `

      SELECT tool_history_damaged.id,
             tool_history_damaged.id_tool,
             tool_nom.name AS tool_name,
             tool_history_damaged.id_user,
             CASE
               WHEN tool_history_damaged.id_user < 0 THEN
                 (SELECT name FROM dbo.tool_user_custom_list WHERE id = -tool_history_damaged.id_user)
               ELSE
                 operators.fio
               END         AS user_name,
             tool_history_damaged.cnc_code,
             cnc.cnc_name,
             tool_history_damaged.comment,
             tool_history_damaged.quantity,
             tool_history_damaged.timestamp
      FROM dbo.tool_history_damaged
             LEFT JOIN dbo.tool_nom ON tool_history_damaged.id_tool = tool_nom.id
             LEFT JOIN dbo.operators ON tool_history_damaged.id_user = operators.id AND tool_history_damaged.id_user > 0
             LEFT JOIN dbo.cnc ON tool_history_damaged.cnc_code = cnc.cnc_code
      ORDER BY tool_history_damaged.timestamp DESC
      LIMIT ${limit} OFFSET ${offset};

    `

    const countResult = await pool.query(countQuery)
    const dataResult = await pool.query(dataQuery)

    res.json({
      currentPage: page,
      itemsPerPage: limit,
      totalCount: parseInt(countResult.rows[0].count, 10),
      toolsHistory: dataResult.rows,
    })
  } catch (err) {
    console.error('Error executing query', err.stack)
    res.status(500).send('Ошибка при выполнении запроса')
  }
}

async function addToolHistoryDamaged(req, res) {
  try {
    // Извлекаем данные из тела запроса
    const { id_tool, id_user, comment, quantity } = req.body
    const cnc_code = req.body.cnc_code || null //  cnc_code становится необязательным

    // Проверяем наличие всех необходимых параметров
    if (!id_tool || !id_user || !comment || !quantity) {
      return res.status(400).send('Отсутствует один из обязательных параметров')
    }

    // Проверяем существование пользователя
    // const userQuery = `SELECT id FROM dbo.operators WHERE id = $1 AND active = 't'`
    // const userResult = await pool.query(userQuery, [id_user])
    //  if (userResult.rows.length === 0) {
    //    return res.status(400).send('Пользователь не найден')
    //  }

    // Проверяем существование станка, если он был передан
    if (cnc_code) {
      const cncQuery = `SELECT cnc_code
                        FROM dbo.cnc
                        WHERE cnc_code = $1
                          AND active = true;`
      const cncResult = await pool.query(cncQuery, [cnc_code])

      if (cncResult.rows.length === 0) {
        console.error(`Станок с кодом ${cnc_code} не найден или не активен.`)
        return res.status(404).json({
          success: false,
          message: `Станок с кодом ${cnc_code} не найден или не активен.`,
        })
      }
    }

    // Проверяем существование инструмента и достаточное количество на складе
    const toolQuery = `SELECT sklad
                       FROM dbo.tool_nom
                       WHERE id = $1;`
    const toolResult = await pool.query(toolQuery, [id_tool])
    if (toolResult.rows.length === 0) {
      return res.status(400).send('Инструмент не найден')
    }
    if (toolResult.rows[0].sklad < quantity) {
      return res.status(400).send('Недостаточно инструмента на складе')
    }

    // Вставка данных в таблицу tool_history_damaged
    const insertQuery = `
      INSERT INTO dbo.tool_history_damaged (id_tool, id_user, cnc_code, comment, quantity, timestamp)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id;
    `
    await pool.query(insertQuery, [
      id_tool,
      id_user,
      cnc_code,
      comment,
      quantity,
    ])

    // Обновление количества инструмента на складе
    const updateSkladQuery = `
      UPDATE dbo.tool_nom
      SET sklad = sklad - $2
      WHERE id = $1;
    `
    // Обновление количества инструмента на складе
    await pool.query(updateSkladQuery, [id_tool, quantity])

    // Проверка обновленного значения количества на складе
    const updatedToolResult = await pool.query(toolQuery, [id_tool])
    const updatedQuantity = updatedToolResult.rows[0].sklad

    // Проверяем, что количество на складе уменьшилось на указанное значение
    if (updatedQuantity !== toolResult.rows[0].sklad - quantity) {
      throw new Error('Ошибка при обновлении количества инструмента на складе')
    }

    res.status(200).json({
      success: 'OK',
      message: 'Запись успешно добавлена и количество на складе обновлено',
      updatedQuantity,
    })
  } catch (error) {
    console.error(
      'Ошибка при добавлении записи о поврежденном инструменте:',
      error
    )
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })
  }
}

module.exports = {
  getDamaged,
  addToolHistoryDamaged,
}
