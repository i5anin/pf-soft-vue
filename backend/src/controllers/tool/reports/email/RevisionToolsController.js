const { Pool } = require('pg')
const ExcelJS = require('exceljs')
const nodemailer = require('nodemailer')
const { emailConfig } = require('../../../../config/config')
const getDbConfig = require('../../../../config/databaseConfig')
const fs = require('fs')

// Настройка подключения к базе данных
const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

async function getReportData() {
  const sql = fs.readFileSync(__dirname + '/RevisionToolsController.sql', 'utf-8')
  const { rows } = await pool.query(sql)
  return rows
}

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
    { header: 'Норма зеленая', key: 'norma_green', width: 10 },
    { header: 'Норма красная', key: 'norma_red', width: 10 },
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
    { header: 'Норма зеленая', key: 'norma_green' },
    { header: 'Норма красная', key: 'norma_red' },
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
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
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

    res.status(200).send('The report has been successfully sent to the specified email.')
  } catch (error) {
    console.error('Error in generating and sending the report:', error)
    // throw error // Не бросаем ошибку, оставляем поток выполнения
    res.status(500).send(`Error in generating and sending the report: ${error.message}`)
  }
}

module.exports = {
  genRevisionInstr,
}
