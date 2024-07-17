const { Pool } = require('pg')
const getDbConfig = require('../../../config/databaseConfig')

const dbConfig = getDbConfig()

// Создание пула соединений с базой данных
const pool = new Pool(dbConfig)

// Экспорт функции для получения дерева инструментов
async function getToolsTree(req, res) {
  try {
    const showOnlyWithTrigger = req.query.folderNotNull === 'true'
    const tree = await buildTreeData(0, showOnlyWithTrigger)
    res.json(tree)
  } catch (error) {
    console.error(error)
    res.status(500).send(error.message)
  }
}

// Функция для построения дерева данных
async function buildTreeData(parentId = 0, showOnlyWithTrigger = false) {
  const { rows } = await pool.query(
    `SELECT t.id, t.parent_id, t.name,
      (SELECT COUNT(*) FROM dbo.tool_nom n WHERE n.parent_id = t.id) as element_count,
      (SELECT COUNT(*) FROM dbo.tool_nom n WHERE n.parent_id = t.id AND n.sklad > 0) as available_count
    FROM dbo.tool_tree t
    WHERE t.parent_id = $1
    ORDER BY t.name ASC`,
    [parentId]
  )

  const treeData = []
  for (const row of rows) {
    const children = await buildTreeData(row.id, showOnlyWithTrigger)

    // Вычисляем общее количество элементов и доступных элементов,
    // включая все уровни вложенности
    const totalElements =
      children.reduce((acc, child) => acc + child.totalElements, 0) +
      parseInt(row.element_count, 10)
    const totalAvailable =
      children.reduce((acc, child) => acc + child.totalAvailable, 0) +
      parseInt(row.available_count, 10)

    // Добавляем папку в дерево только если:
    // 1. Мы не фильтруем пустые папки (showOnlyWithTrigger = false)
    // 2. ИЛИ общее количество элементов больше 0 (totalElements > 0),
    //    что означает наличие элементов на любом уровне вложенности
    if (!showOnlyWithTrigger || totalElements > 0) {
      treeData.push({
        id: row.id,
        label: row.name,
        elements: parseInt(row.element_count, 10),
        available: parseInt(row.available_count, 10),
        totalElements: totalElements,
        totalAvailable: totalAvailable,
        nodes: children,
      })
    }
  }
  return treeData
}

async function dellFolderTree(req, res) {
  try {
    const itemId = req.params.id

    // Запрет на удаление папки с ID 0
    if (itemId === '0') {
      return res.status(400).send({
        message: 'Нельзя удалить папку с ID 0',
        reason: 'Deletion of folder with ID 0 is prohibited',
      })
    }

    // Проверка существования папки
    const folderExistResult = await pool.query(
      'SELECT id, parent_id FROM dbo.tool_tree WHERE id = $1',
      [itemId]
    )

    if (folderExistResult.rows.length === 0) {
      return res.status(400).send({
        message: 'Папка не существует',
        reason: 'Folder does not exist',
      })
    }

    const idParent = folderExistResult.rows[0].parent_id

    // Запрет на удаление корневой папки
    if (idParent === 0) {
      return res.status(400).send({
        message: 'Нельзя удалить корневую папку',
        reason: 'Deletion of root folder is prohibited',
      })
    }

    // Проверка наличия дочерних элементов
    const childCheckResult = await pool.query(
      'SELECT id FROM dbo.tool_tree WHERE parent_id = $1',
      [itemId]
    )

    if (childCheckResult.rows.length > 0) {
      return res.status(400).send({
        message: 'Нельзя удалить папку с дочерними элементами',
        reason: 'Folder has child elements',
      })
    }

    // Проверка отсутствия привязанных номенклатур
    const nomenclatureCheckResult = await pool.query(
      'SELECT id FROM dbo.tool_nom WHERE parent_id = $1',
      [itemId]
    )

    if (nomenclatureCheckResult.rows.length > 0) {
      return res.status(400).send({
        message: 'Нельзя удалить папку с привязанными номенклатурами',
        reason: 'Folder is linked to nomenclature',
      })
    }

    // Удаление папки из базы данных
    await pool.query('DELETE FROM dbo.tool_tree WHERE id = $1', [itemId])

    res.status(200).send({ message: 'Папка успешно удалена' })
  } catch (error) {
    console.error('Ошибка при удалении папки:', error)
    res
      .status(500)
      .send({ message: 'Ошибка при удалении папки', reason: error.message })
  }
}

async function updateFolderTree(req, res) {
  // console.log('Request body:', req.body) // Для отладки
  try {
    const { id, newName } = req.body // Получение ID и нового названия из тела запроса

    if (!id || !newName) {
      return res.status(400).json({ message: 'Необходимы ID и новое имя папки' })
    }

    // Получение текущего parent_id для данной записи
    const parentCheckResult = await pool.query(
      'SELECT parent_id FROM dbo.tool_tree WHERE id = $1',
      [id]
    )

    if (parentCheckResult.rows.length === 0) {
      return res.status(400).json({ message: 'Запись не найдена.' })
    }

    const currentParentId = parentCheckResult.rows[0].parent_id

    // Проверка, чтобы не разрешать обновление для parent_id равного 0
    if (currentParentId === 0) {
      return res
        .status(400)
        .json({ message: 'Переименование корневой папки запрещено' })
    }

    // Выполнение SQL запроса на обновление
    await pool.query('UPDATE dbo.tool_tree SET name = $1 WHERE id = $2', [
      newName,
      id,
    ])

    res.json({ message: 'Название папки успешно обновлено' })
  } catch (error) {
    console.error('Ошибка при обновлении названия папки:', error)
    res.status(500).json({ message: 'Ошибка сервера', reason: error.message })
  }
}

const addBranch = async (req, res) => {
  try {
    // Check for malformed JSON input
    if (!req.body) {
      return res.status(400).json({ message: 'Invalid JSON input' })
    }

    const { name, parentId } = req.body

    // First, check if the parentId exists in the database
    const parentCheckResult = await pool.query(
      `SELECT id FROM dbo.tool_tree WHERE id = $1`,
      [parentId]
    )

    // If the parentId does not exist, send an error response
    if (parentCheckResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: `Branch ID ${parentId} does not exist.` })
    }

    // Execute SQL query to insert the new branch
    const result = await pool.query(
      `INSERT INTO dbo.tool_tree (name, parent_id)
       VALUES ($1, $2)
       RETURNING id`,
      [name, parentId]
    )

    // Respond with the ID of the newly added branch
    res.json({
      message: 'New branch added successfully.',
      newBranchId: result.rows[0].id,
    })
  } catch (error) {
    console.error('Error adding new branch:', error)
    res.status(500).json({ message: `Error: ${error.message}` })
  }
}

module.exports = {
  updateFolderTree,
  dellFolderTree,
  getToolsTree,
  addBranch,
}
