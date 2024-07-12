const { Pool } = require('pg')
const fs = require('fs')
const ExcelJS = require('exceljs')
const nodemailer = require('nodemailer')
const { emailConfig } = require('../../../../config/config')
const getDbConfig = require('../../../../config/databaseConfig')

// Настройка подключения к базе данных
const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

// SQL-запросы для разных типов отчетов
const sqlQueries = {
  '1_regular': fs.readFileSync(__dirname + '/OrderToolsController/1_regular.sql', 'utf-8'),
  '2_group': fs.readFileSync(__dirname + '/OrderToolsController/2_group.sql', 'utf-8'),
  '3_regular_3_norma': fs.readFileSync(
    __dirname + '/OrderToolsController/3_regular_3_norma.sql',
    'utf-8'
  ),
  '4_group_3_norma': fs.readFileSync(
    __dirname + '/OrderToolsController/4_group_3_norma.sql',
    'utf-8'
  ),
}

async function getReportData(reportType) {
  const sql = sqlQueries[reportType]
  if (!sql) {
    throw new Error(`Invalid report type: ${reportType}`)
  }
  const { rows } = await pool.query(sql)
  return rows
}

function getCurrentMonthDates() {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const firstDate = firstDayOfMonth.toISOString().split('T')[0]
  const lastDate = lastDayOfMonth.toISOString().split('T')[0]

  return { firstDate, lastDate }
}

//  Функция для создания Excel файла и возврата его как потока данных
async function createExcelFileStream(data) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Отчёт')

  // Добавляем заголовки (адаптируйте под ваш отчет)
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
      header: 'Заказ',
      key: 'zakaz',
      width: 10,
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF00' },
        },
      },
    },
    { header: 'Склад группы', key: 'group_sum', width: 20 },
    { header: 'На складе', key: 'sklad', width: 10 },
    { header: 'Норма', key: 'norma', width: 10 },
    { header: 'Путь', key: 'tool_path', width: 30 },
    { header: 'Норма Зеленая', key: 'norma_green', width: 30 },
    { header: 'Норма Красная', key: 'norma_red', width: 30 },
  ]

  // Добавляем данные (адаптируйте под ваш отчет)
  let index = 1
  data.forEach((item) => {
    let zakazRounded = item.zakaz
    // Round only if the tool path includes "пластины"
    if (item.tool_path && item.tool_path.toLowerCase().includes('пластины')) {
      zakazRounded = getRoundedCount(item.zakaz)
    }

    worksheet.addRow({
      index: index++,
      id_tool: item.id_tool,
      name: item.name,
      sklad: Number(item.sklad) || Number(0),
      norma: Number(item.norma) || '',
      zakaz: Number(zakazRounded) || '',
      tool_path: item.tool_path || 'Не указан',
      group_sum: Number(item.group_sum) || '',
      norma_green: item.norma_green,
      norma_red: item.norma_red,
      // ... другие поля отчета
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
    column.width = maxLength < 10 ? 10 : maxLength
  })

  const stream = new require('stream').PassThrough()
  await workbook.xlsx.write(stream)
  stream.end()
  return stream
}

// Функция для отправки сообщения с файлом на почту
async function sendEmailWithExcelStream(email, text, excelStream, data, reportType) {
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: { user: emailConfig.user, pass: emailConfig.pass },
  })

  const { firstDate, lastDate } = getCurrentMonthDates()
  const envPrefix = process.env.NODE_ENV === 'development' ? 'development ' : ''
  const subject = `${envPrefix}Заказ: Журнал инструмента (${reportType})`

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: subject,
    text: text,
    attachments: [
      {
        filename: `Поврежденный инструмент (${reportType}).xlsx`,
        content: excelStream,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  }

  // Отправка письма
  try {
    console.log(`\nЗаказ: Журнал инструмента (${reportType})`)
    console.log(`Отчет будет отправлен на email: ${email}`)
    await transporter.sendMail(mailOptions)
    console.log(`Отчет успешно отправлен на email: ${email}.\n`)
  } catch (error) {
    console.error('Ошибка при отправке письма:', error)
    throw error
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
async function genZayavInstr(req, res) {
  try {
    // Проверка токена авторизации
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      return res.status(401).send('Authorization token is missing or invalid.')
    }
    const token = req.headers.authorization.split(' ')[1]
    if (!token) {
      return res.status(401).send('Bearer token is malformed.')
    }

    // Получение типа отчета из тела запроса
    const { reportType } = req.body
    if (!reportType) {
      return res.status(400).send('Report type is required.')
    }
    if (!sqlQueries[reportType]) {
      return res.status(400).send(`Invalid report type: ${reportType}`)
    }

    const email = await getUserEmailByToken(token)
    const data = await getReportData(reportType)
    if (data.length === 0) {
      return res.status(404).send('No data available for the report.')
    }

    const excelStream = await createExcelFileStream(data)
    const emailText = 'Please find the attached Excel report.'
    await sendEmailWithExcelStream(email, emailText, excelStream, data, reportType)

    res.status(200).send('The report has been successfully sent.')
  } catch (error) {
    console.error('Error in generating and sending the report:', error)
    res.status(500).send(`Error in generating and sending the report: ${error.message}`)
  }
}

// Функция для округления заказа
function getRoundedCount(count) {
  if (count < 10) return 10
  return count % 10 < 5 ? Math.floor(count / 10) * 10 : Math.ceil(count / 10) * 10
}

module.exports = {
  genZayavInstr,
}
