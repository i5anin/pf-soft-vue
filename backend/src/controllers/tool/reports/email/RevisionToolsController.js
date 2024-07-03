const { Pool } = require('pg')
const ExcelJS = require('exceljs')
const nodemailer = require('nodemailer')
const { emailConfig } = require('../../../../config/config')
const getDbConfig = require('../../../../config/databaseConfig')

// Настройка подключения к базе данных
const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

// Функция для получения данных из базы данных
async function getReportData() {
  const query = `WITH RECURSIVE
                   TreePath AS (SELECT id, CAST(name AS TEXT) AS path, parent_id
                                FROM dbo.tool_tree
                                WHERE parent_id = 1
                                UNION ALL
                                SELECT tt.id, CONCAT(tp.path, ' / ', tt.name) AS path, tt.parent_id
                                FROM dbo.tool_tree tt
                                       JOIN TreePath tp ON tt.parent_id = tp.id),
                   totals AS (SELECT group_id, SUM(sklad) AS group_total_sklad
                              FROM dbo.tool_nom
                              WHERE group_id IS NOT NULL
                                AND group_id <> 0
                              GROUP BY group_id),
                   damaged AS (SELECT tn.id                          AS id_tool, -- Explicitly alias as id_tool
                                      tn.name,
                                      tn.sklad,
                                      tn.norma,
                                      tn.parent_id,
                                      tn.group_id,
                                      tn.group_standard,
                                      CASE
                                        WHEN tn.group_id IS NOT NULL AND tn.group_id <> 0 THEN
                                          GREATEST(tn.norma - t.group_total_sklad, 0)
                                        ELSE
                                          GREATEST(tn.norma - tn.sklad, 0)
                                        END                          AS zakaz,
                                      COALESCE(SUM(thd.quantity), 0) AS damaged_last_7_days,
                                      t.group_total_sklad            AS group_sum
                               FROM dbo.tool_nom tn
                                      LEFT JOIN dbo.tool_history_damaged thd
                                                ON tn.id = thd.id_tool AND thd.timestamp >= CURRENT_DATE - INTERVAL '7 days'
                                      LEFT JOIN totals t ON tn.group_id = t.group_id
                               GROUP BY tn.id, tn.parent_id, tn.name, tn.sklad, tn.norma, tn.group_id,
                                        tn.group_standard, t.group_total_sklad)
                 SELECT tn.id                              AS id_tool, -- Alias it again here for consistency
                        tn.name,
                        tn.sklad,
                        tn.norma,
                        tn.parent_id,
                        tn.group_id,
                        tn.group_standard,
                        tp.path                            AS tool_path,
                        COALESCE(d.zakaz, 0)               AS zakaz,
                        COALESCE(d.damaged_last_7_days, 0) AS damaged_last_7_days,
                        COALESCE(d.group_sum, 0)           AS group_sum
                 FROM dbo.tool_nom tn
                        LEFT JOIN TreePath tp ON tn.parent_id = tp.id
                        LEFT JOIN damaged d ON tn.id = d.id_tool
                 ORDER BY tp.path, tn.name;
  `

  const { rows } = await pool.query(query)
  return rows
}

// Функция для получения первого и последнего дня текущего месяца
// function getCurrentMonthDates() {
//   const currentDate = new Date()
//   const firstDayOfMonth = new Date(
//     currentDate.getFullYear(),
//     currentDate.getMonth(),
//     1
//   )
//   const lastDayOfMonth = new Date(
//     currentDate.getFullYear(),
//     currentDate.getMonth() + 1,
//     0
//   )
//
//   const firstDate = firstDayOfMonth.toISOString().split('T')[0]
//   const lastDate = lastDayOfMonth.toISOString().split('T')[0]
//
//   return { firstDate, lastDate }
// }

//  Функция для создания Excel файла и возврата его как потока данных
async function createExcelFileStream(data) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Отчёт')

  // Добавляем заголовки
  worksheet.columns = [
    { header: '# Excel', key: 'index', width: 5 },
    { header: 'ID', key: 'id_tool', width: 5 },
    {
      header: 'Название',
      key: 'name',
      width: 28,
      style: { font: { bold: true } },
    },

    {
      header: 'На складе',
      key: 'sklad',
      width: 10,
      style: { font: { bold: true } },
    },
    { header: 'Склад группы', key: 'group_sum', width: 20 },
    { header: 'Группа ID', key: 'group_display', width: 15 },
    { header: 'Стандарт', key: 'group_standard', width: 15 },
    { header: 'Путь', key: 'tool_path', width: 30 },
    {
      header: 'Заказ',
      key: 'zakaz',
      width: 10,
    },
    { header: 'Норма', key: 'norma', width: 10 },
  ]

  // Добавляем данные
  let index = 1
  data.forEach((item) => {
    worksheet.addRow({
      index: index++,
      id_tool: item.id_tool, // Удаляем  id_tool, так как он пуст
      name: item.name,
      sklad: Number(item.sklad) || Number(0),
      norma: Number(item.norma) || '',
      zakaz: Number(item.zakaz) || '',
      group_display: Number(item.group_display) || '',
      group_standard: item.group_standard ? 'Да' : 'Нет',
      tool_path: item.tool_path ? item.tool_path : 'Не указан',
      group_sum: Number(item.group_sum) || '',
    })
  })

  // Автонастройка ширины ячеек
  worksheet.columns.forEach((column) => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, (cell) => {
      let cellLength = cell.value ? cell.value.toString().length : 10
      if (cellLength > maxLength) {
        maxLength = cellLength
      }
    })
    column.width = maxLength < 10 ? 10 : maxLength // Устанавливаем минимальную ширину 10
  })

  const stream = new require('stream').PassThrough()
  await workbook.xlsx.write(stream)
  stream.end()
  return stream
}

// Функция для генерации HTML таблицы
function generateHtmlTable(data) {
  // Определение заголовков для таблицы
  const headers = [
    { header: '# HTML', key: 'index' },
    { header: 'ID', key: 'id_tool' },
    { header: 'Название', key: 'name' },
    { header: 'Склад группы', key: 'group_sum' },
    { header: 'На складе', key: 'sklad' },
    { header: 'Группа ID', key: 'group_display' },
    { header: 'Стандарт', key: 'group_standard' },
    { header: 'Путь', key: 'tool_path' },
    { header: 'Заказ', key: 'zakaz' },
    { header: 'Норма', key: 'norma' },
  ]

  let htmlContent = `<h2>Ревизия</h2>`
  htmlContent += `<table border='1' style='border-collapse: collapse;'><tr>`

  // Генерируем шапку таблицы
  headers.forEach((header) => {
    htmlContent += `<th>${header.header}</th>`
  })

  htmlContent += `</tr>`

  // Генерация строк таблицы
  data.forEach((item, index) => {
    htmlContent += `<tr>`
    headers.forEach(({ key }) => {
      let value = ''
      switch (key) {
        case 'index':
          value = index + 1
          break
        case 'sklad':
          value = item[key] || 0
          break
        default:
          value = item[key] || ''
      }
      htmlContent += `<td>${value}</td>`
    })
    htmlContent += `</tr>`
  })

  htmlContent += `</table>`

  return htmlContent
}

// Функция для отправки сообщения с файлом на почту, использующая generateHtmlTable
async function sendEmailWithExcelStream(email, text, excelStream, data) {
  // Используем переменные emailConfig, как раньше

  // Использование значений из переменных окружения, если они определены, иначе из config
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure, // В зависимости от вашего сервера это может быть true
    auth: { user: emailConfig.user, pass: emailConfig.pass },
  })

  // const { firstDate, lastDate } = getCurrentMonthDates()
  const envPrefix = process.env.NODE_ENV === 'development' ? 'development ' : ''
  const subject = `${envPrefix}Ревизия`

  const htmlContent = generateHtmlTable(data) // Генерация HTML

  const today = new Date()
  const formattedDate = today.toLocaleDateString('ru-RU') // Форматирование даты в формате "дд.мм.гггг"

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: subject,
    text: text,
    html: htmlContent, // Вставка сгенерированного HTML
    attachments: [
      {
        filename: `Инструмент весь ${formattedDate}.xlsx`, // Добавляем дату в имя файла
        content: excelStream,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  }

  // Отправка письма
  try {
    console.log(`\nЗаказ: Журнал инструмента за неделю`)
    console.log(`Отчет будет отправлен на email: ${email}`)
    await transporter.sendMail(mailOptions)
    console.log(`Отчет успешно отправлен на email: ${email}.\n`)
  } catch (error) {
    console.error('Ошибка при отправке письма:', error)
    // throw error // Не бросаем ошибку, оставляем поток выполнения
  }
}

// Функция для определения пользователя по токену и получения его email
async function getUserEmailByToken(token) {
  const query = 'SELECT email FROM dbo.vue_users WHERE token = $1;'
  const { rows } = await pool.query(query, [token])
  if (rows.length === 0) throw new Error('Пользователь не найден.')
  return rows[0].email
}

// Объединение функционала
async function genRevisionInstr(req, res) {
  try {
    // Check if the Authorization header is present and correctly formatted
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('Bearer ')
    ) {
      res.status(400).send('Authorization token is missing or invalid.')
      return
    }

    // Safely extract the token
    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
      res.status(400).send('Bearer token is malformed.')
      return
    }

    const email = await getUserEmailByToken(token)

    const data = await getReportData()
    if (data.length === 0) {
      res.status(404).send('No data available for the report.')
      return
    }

    const excelStream = await createExcelFileStream(data)
    const emailText = 'Please find the attached Excel report.'
    await sendEmailWithExcelStream(email, emailText, excelStream, data)

    res
      .status(200)
      .send('The report has been successfully sent to the specified email.')
  } catch (error) {
    console.error('Error in generating and sending the report:', error)
    // throw error // Не бросаем ошибку, оставляем поток выполнения
    res
      .status(500)
      .send(`Error in generating and sending the report: ${error.message}`)
  }
}

module.exports = {
  genRevisionInstr,
}
