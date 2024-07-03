// Импорт зависимостей
const { Pool } = require('pg')
const getDbConfig = require('../../../config/databaseConfig')

const dbConfig = getDbConfig()
// Создание пула подключений к БД
const pool = new Pool(dbConfig)

async function getParamsMapping() {
  const query = 'SELECT id, label FROM dbo.tool_params'
  const result = await pool.query(query)
  return result.rows.reduce((acc, row) => {
    acc[row.id] = { label: row.label }
    return acc
  }, {})
}

function removeNullProperties(obj) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null) {
      delete obj[key]
    }
  })
  return obj
}

function replaceCommaWithDotInNumbers(obj) {
  const regex = /(\d),(\d)/g
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Заменяем только запятые, которые находятся между числами
      obj[key] = obj[key].replace(regex, '$1.$2')
    }
  }
}

async function getTools(req, res) {
  try {
    // Объединение параметров из тела POST-запроса и параметров строки запроса GET-запроса
    const params = { ...req.query, ...req.body }

    const { search, parent_id, onlyInStock, page = 1, limit = 50 } = params

    const pageNumber = parseInt(page, 10)
    const limitNumber = parseInt(limit, 10)
    const offset = (pageNumber - 1) * limitNumber

    let conditions = []

    // Обработка стандартных параметров для фильтрации
    if (search)
      conditions.push(`tool_nom.name ILIKE '%${search.replace(/'/g, '\'\'')}%'`)

    if (parent_id) conditions.push(`tool_nom.parent_id = ${parent_id}`)

    if (onlyInStock === 'true') conditions.push(`tool_nom.sklad > 0`)

    // Обработка динамических параметров для фильтрации
    let dynamicParams = Object.entries(params)
      .filter(([key, value]) => key.startsWith('param_') && value)
      .map(([key, value]) => {
        const paramId = key.split('_')[1] // Извлечение ID параметра
        return `tool_nom.property ->> '${paramId}' = '${value.replace(
          /'/g,
          '\'\'',
        )}'`
      })

    conditions = [...conditions, ...dynamicParams]

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // SQL запросы для получения инструментов и их количества
    const countQuery = `
      SELECT COUNT(*)
      FROM dbo.tool_nom as tool_nom
        ${whereClause}
    `

    const toolQuery = `
      SELECT tool_nom.id,
             tool_nom.name,
             tool_nom.property,
             tool_nom.sklad,
             tool_nom.norma,
             tool_nom.group_id,
             tool_nom.group_standard
      FROM dbo.tool_nom as tool_nom
        ${whereClause}
      ORDER BY
        CASE WHEN tool_nom.sklad > 0 THEN 1 ELSE 2
      END,
        tool_nom.name
      LIMIT ${limitNumber} OFFSET ${offset}
    `

    // Выполнение запросов и получение данных параметров одновременно
    const [countResult, toolsResult, paramsMapping] = await Promise.all([
      pool.query(countQuery),
      pool.query(toolQuery),
      getParamsMapping(),
    ])

    const totalCount = parseInt(countResult.rows[0].count, 10)

    // Обработка инструментов и параметров для ответа
    const uniqueParams = new Set()
    const propertyValues = {}

    const formattedTools = toolsResult.rows.map((tool) => {
      let formattedProperty = {}

      if (tool.property) {
        const propertyObj = tool.property

        formattedProperty = Object.entries(propertyObj).reduce(
          (acc, [key, value]) => {
            if (value !== '' && value !== null && paramsMapping[key]) {
              acc[key] = {
                label: paramsMapping[key].label,
                value: value,
              }
              uniqueParams.add(key)

              if (!propertyValues[key]) {
                propertyValues[key] = new Set()
              }
              propertyValues[key].add(value)
            }
            return acc
          },
          {},
        )
      }

      return {
        id: tool.id,
        name: tool.name,
        property: formattedProperty,
        sklad: tool.sklad,
        norma: tool.norma,
        group_id: tool.group_id,
        group_standard: tool.group_standard,
      }
    })

    Object.keys(propertyValues).forEach((key) => {
      propertyValues[key] = Array.from(propertyValues[key])
    })
    Array.from(uniqueParams)
      .map((key) => {
        const values = propertyValues[key]
        if (values && values.length > 1) {
          return {
            key: key,
            label: paramsMapping[key]?.label || key,
            values: values,
          }
        }
        return null
      })
      .filter((item) => item != null)
    // Отправка ответа
    res.json({
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
      totalCount,
      tools: formattedTools,
      // paramsList, TODO:DEL
    })
  } catch (err) {
    console.error(err)
    res.status(500).send(err.message)
  }
}

async function deleteTool(req, res) {
  const { id } = req.params
  try {
    // Проверяем наличие инструмента в истории выдачи
    const toolInIssueHistory = await pool.query(
      `SELECT 1
       FROM dbo.tool_history_nom
       WHERE id_tool = $1`,
      [id],
    )

    // Проверяем наличие инструмента в списке уничтоженных
    const toolInDamagedHistory = await pool.query(
      `SELECT 1
       FROM dbo.tool_history_damaged
       WHERE id_tool = $1`,
      [id],
    )

    if (toolInIssueHistory.rowCount > 0 || toolInDamagedHistory.rowCount > 0) {
      // Если инструмент есть в истории выдачи или среди уничтоженных, возвращаем ошибку
      return res.status(400).json({
        error:
          'Удаление запрещено: инструмент используется в истории выдачи или уничтожен.',
      })
    }

    // Если проверки пройдены, удаляем инструмент
    const toolExists = await pool.query(
      `SELECT id
       FROM dbo.tool_nom
       WHERE id = $1`,
      [id],
    )

    if (toolExists.rowCount > 0) {
      await pool.query(
        `DELETE
         FROM dbo.tool_nom
         WHERE id = $1`,
        [id],
      )
      res.json({ success: 'OK' })
    } else {
      res.status(404).json({ error: 'Инструмент с таким ID не найден.' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
}

async function addTool(req, res) {
  const {
    name,
    parent_id,
    property,
    sklad,
    norma,
    group_id,
    group_standard,
    norma_red,
    norma_green,
  } = req.body
  // Преобразование запятых в точки в числах в property
  replaceCommaWithDotInNumbers(property)

  try {
    if (parent_id <= 1) {
      return res
        .status(400)
        .json({ error: 'parent_id must be greater than 1.' })
    }

    if (sklad < 0)
      return res.status(400).json({ error: 'Склад не может быть отрицательным.' })


    // Проверка на корректность значений норм для светофора (изменено условие)
    if (norma_green < norma || norma < norma_red)
      return res.status(400).json({ error: 'Некорректные значения норм для светофора: green > norma > red.' })


    if (property && property.id) {
      const propertyIdCheckResult = await pool.query(
        'SELECT id FROM dbo.tool_params WHERE id = $1',
        [property.id],
      )

      if (propertyIdCheckResult.rowCount === 0) {
        return res.status(400).json({
          error: 'Specified property.id does not exist in tool_params.',
        })
      }
    }

    const parentCheckResult = await pool.query(
      'SELECT id FROM dbo.tool_tree WHERE id = $1',
      [parent_id],
    )

    if (parentCheckResult.rowCount === 0) {
      return res
        .status(400)
        .json({ error: 'Specified parent_id does not exist.' })
    }

    const propertyWithoutNull = removeNullProperties(property)
    const propertyString = JSON.stringify(propertyWithoutNull)

    // Если group_standard == true, то необходимо сбросить флаг эталонного инструмента для предыдущего эталона в той же группе
    if (group_standard && group_id) {
      await pool.query(
        'UPDATE dbo.tool_nom SET group_standard = false WHERE group_id = $1',
        [group_id],
      )
    }

    const toolInsertResult = await pool.query(
      'INSERT INTO dbo.tool_nom (name, parent_id, property, sklad, norma, group_id, group_standard, norma_red, norma_green) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [name, parent_id, propertyString, sklad, norma, group_id, group_standard, norma_red, norma_green],
    )

    const toolId = toolInsertResult.rows[0].id

    // Логирование добавления инструмента
    const logMessage = `Инструмент успешно добавлен ID ${toolId}, группа ${group_id}.`
    await pool.query(
      'INSERT INTO dbo.vue_log (message, tool_id, datetime_log, new_amount) VALUES ($1, $2, NOW(), $3)',
      [logMessage, toolId, sklad],
    )

    const newToolResult = await pool.query(
      'SELECT * FROM dbo.tool_nom WHERE id = $1',
      [toolId],
    )

    if (newToolResult.rowCount > 0) {
      res.status(200).json({ success: 'OK', data: newToolResult.rows[0] })
    } else {
      res.status(404).json({ error: 'Tool added, but not found.' })
    }
  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({ error: 'Error adding tool: ' + err.message })
  }
}

async function editTool(req, res) {
  const { id } = req.params
  const {
    name,
    parent_id,
    property,
    sklad: newSklad,
    norma,
    group_id,
    group_standard,
    norma_red, // Добавлено поле norma_red
    norma_green, // Добавлено поле norma_green
  } = req.body

  replaceCommaWithDotInNumbers(property)

  try {
    if (parent_id <= 1) {
      return res
        .status(400)
        .json({ error: 'parent_id must be greater than 1.' })
    }

    if (property && property.id) {
      const propertyIdCheckResult = await pool.query(
        'SELECT id FROM dbo.tool_params WHERE id = $1',
        [property.id],
      )

      if (propertyIdCheckResult.rowCount === 0) {
        return res.status(400).json({
          error: 'Specified property.id does not exist in tool_params.',
        })
      }
    }

    const parentCheckResult = await pool.query(
      'SELECT id FROM dbo.tool_tree WHERE id = $1',
      [parent_id],
    )

    if (parentCheckResult.rowCount === 0) {
      return res
        .status(400)
        .json({ error: 'Specified parent_id does not exist.' })
    }

    // Проверка на неотрицательное значение склада
    if (newSklad < 0) return res.status(400).json({ error: 'Склад не может быть отрицательным.' })


    // Проверка на корректность значений норм для светофора (изменено условие)
    if (norma_green < norma || norma < norma_red)
      return res.status(400).json({ error: 'Некорректные значения норм для светофора: green > norma > red.' })


    const currentSkladResult = await pool.query(
      'SELECT sklad FROM dbo.tool_nom WHERE id = $1',
      [id],
    )

    if (currentSkladResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: 'Tool with the specified ID not found.' })
    }

    const oldSklad = currentSkladResult.rows[0].sklad
    const propertyWithoutNull = removeNullProperties(property)
    const propertyString = JSON.stringify(propertyWithoutNull)

    if (group_standard) {
      // Сброс флага group_standard для всех инструментов в группе
      await pool.query(
        'UPDATE dbo.tool_nom SET group_standard=false WHERE group_id=$1 AND id<>$2',
        [group_id, id],
      )
    }

    const result = await pool.query(
      'UPDATE dbo.tool_nom SET name=$1, parent_id=$2, property=$3, sklad=$4, norma=$5, group_id=$7, group_standard=$8, norma_red=$9, norma_green=$10 WHERE id=$6 RETURNING *', // Добавлены поля norma_red и norma_green
      [
        name,
        parent_id,
        propertyString,
        newSklad,
        norma,
        id,
        group_id,
        group_standard,
        norma_red, // Добавлено значение norma_red
        norma_green, // Добавлено значение norma_green
      ],
    )

    if (result.rowCount > 0) {
      await pool.query(
        'INSERT INTO dbo.vue_log (message, tool_id, datetime_log, old_amount, new_amount) VALUES ($1, $2, NOW(), $3, $4)',
        [`Обновлен ID инструмента ${id}`, id, oldSklad, newSklad],
      )

      res.status(200).json({ success: 'OK', data: result.rows[0] })
    } else {
      res.status(404).json({ error: 'Tool with the specified ID not found.' })
    }
  } catch (err) {
    console.error('Error:', err.message)
    res.status(500).json({ error: 'Error updating tool: ' + err.message })
  }
}

async function getToolById(req, res) {
  const { id } = req.params // Получение ID инструмента из параметров маршрута

  try {
    // Измененный запрос для получения данных инструмента и названия папки
    const query = `
      SELECT dbo.tool_nom.*, dbo.tool_tree.name as folder_name
      FROM dbo.tool_nom
             LEFT JOIN dbo.tool_tree ON dbo.tool_nom.parent_id = dbo.tool_tree.id
      WHERE dbo.tool_nom.id = $1`

    const result = await pool.query(query, [id])

    if (result.rows.length > 0) {
      const toolData = result.rows[0]

      // Создание JSON-ответа с данными инструмента и названием папки
      const jsonResponse = {
        id: toolData.id,
        parent_id: toolData.parent_id,
        name: toolData.name,
        folder_name: toolData.folder_name,
        property: toolData.property,
        sklad: toolData.sklad,
        group_id: toolData.group_id,
        group_standard: toolData.group_standard,
        norma: toolData.norma,
        norma_red: toolData.norma_red, // Добавлено поле norma_red
        norma_green: toolData.norma_green, // Добавлено поле norma_green
      }

      res.json(jsonResponse)
    } else {
      res.status(404).send('Инструмент не найден')
    }
  } catch (error) {
    console.error('Ошибка при получении инструмента:', error)
    res.status(500).send('Внутренняя ошибка сервера')
  }
}

async function getFilterParamsByParentId(req, res) {
  let { parent_id } = req.params
  parent_id = Number(parent_id)

  if (isNaN(parent_id) || !Number.isInteger(parent_id)) {
    return res.status(400).json({ error: 'Parent ID must be an integer' })
  }

  try {
    // Получаем маппинг параметров и их порядки
    const queryMapping = `SELECT id, label, param_order
                          FROM dbo.tool_params` // Выбираем id здесь
    const mappingResult = await pool.query(queryMapping)
    const paramsMapping = mappingResult.rows.reduce(
      (acc, { id, label, param_order }) => {
        // Используем id как ключ
        acc[id] = { label, param_order }
        return acc
      },
      {},
    )

    // Запрос на получение свойств инструментов
    const query = `SELECT property
                   FROM dbo.tool_nom
                   WHERE parent_id = $1`
    const { rows } = await pool.query(query, [parent_id])

    const paramsAggregation = {}

    rows.forEach((row) => {
      Object.entries(row.property || {}).forEach(([key, value]) => {
        if (!paramsAggregation[key])
          paramsAggregation[key] = { numbers: new Set(), texts: new Set() }
        const floatValue = parseFloat(value)
        if (!isNaN(floatValue) && isFinite(value))
          paramsAggregation[key].numbers.add(floatValue)
        else paramsAggregation[key].texts.add(value)
      })
    })

    let paramsList = Object.entries(paramsAggregation)
      .map(([key, { numbers, texts }]) => ({
        param_order: paramsMapping[key]?.param_order, // Добавляем param_order в объект
        key: key, // Используем key как есть (это id из tool_params)
        label: paramsMapping[key]?.label || key,
        values: [
          ...Array.from(numbers).sort((a, b) => a - b),
          ...Array.from(texts).sort(),
        ],
      }))
      .filter((param) => param.values.length > 0)
      .sort((a, b) => a.param_order - b.param_order) // Сортируем по param_order

    res.json(paramsList)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
}

async function getToolNameId(req, res) {
  try {
    // Получаем parent_id из параметров маршрута
    const parentId = req.params.id
    // Запрос на выборку id и name всех инструментов, у которых parent_id соответствует переданному параметру
    const query = 'SELECT id, name FROM dbo.tool_nom WHERE parent_id = $1'
    const { rows } = await pool.query(query, [parentId])

    // Преобразуем массив объектов в массив строк названий инструментов
    const namesArray = rows.map((row) => row.name)

    // Возвращаем результат в ответе
    res.json(namesArray)
  } catch (error) {
    console.error(
      'Ошибка при получении названий инструментов по parent_id:',
      error
    )
    res.status(500).send('Server error')
  }
}

// Экспорт контроллеров
module.exports = {
  getToolNameId,
  getToolById,
  getTools,
  addTool,
  editTool,
  deleteTool,
  getFilterParamsByParentId,
}
