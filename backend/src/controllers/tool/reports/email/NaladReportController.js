const { Pool } = require('pg')
const ExcelJS = require('exceljs')
const nodemailer = require('nodemailer')
const { emailConfig } = require('../../../../config/config')
const getDbConfig = require('../../../../config/databaseConfig')

// Настройка подключения к базе данных
const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

// Функция для получения данных из базы данных
// Функция для получения данных из базы данных
async function getReportData() {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  )
  const firstDayOfMonthStr = firstDayOfMonth.toISOString().slice(0, 10) + ' 00:00:00' // Форматируем дату для SQL запроса

  const query = `
    WITH RankedRecords AS (
        SELECT
            marsh_naladka.cnc_code,
            CONCAT(NAME, ' ', description, ' операция: ', NO) AS det_name,
            'наладчик' AS fio_nalad,
            marsh_naladka.datetime_nal,
            ROW_NUMBER() OVER (
                PARTITION BY CAST(marsh_naladka.datetime_nal AS DATE)
                ORDER BY LENGTH(CONCAT(NAME, ' ', description)), marsh_naladka.datetime_nal
            ) AS rn
        FROM
            dbo.marsh_naladka
            INNER JOIN dbo.specs_nom_operations ON specs_nom_operations.ID = marsh_naladka.specs_op_id
            INNER JOIN dbo.specs_nom ON specs_nom.ID = specs_nom_operations.specs_nom_id
            INNER JOIN dbo.operations_ordersnom ON operations_ordersnom.op_id = specs_nom_operations.ordersnom_op_id
        WHERE
            marsh_naladka.datetime_nal >= '${firstDayOfMonthStr}' -- Изменено условие для выборки с 1 числа текущего месяца
            AND dbo.get_op_cnc_type(specs_nom_operations.id) = 'Т'
    )
    SELECT
        cnc_name Станок,
        det_name Наименование,
        fio_nalad Нададчик,
        TO_CHAR(datetime_nal::DATE, 'DD.MM.YYYY') Дата
    FROM
        RankedRecords
        INNER JOIN dbo.cnc ON cnc.cnc_code = RankedRecords.cnc_code
    WHERE
        rn <= 3
    ORDER BY
        CAST(datetime_nal AS DATE),
        rn;
  `

  try {
    const { rows } = await pool.query(query)
    console.log('Данные из базы данных (getReportData):', rows)
    return rows
  } catch (error) {
    console.error(
      'Ошибка при получении данных из базы данных (getReportData):',
      error
    )
    throw error
  }
}

function getCurrentMonthDates() {
  const currentDate = new Date()
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  )
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  )

  const firstDate = firstDayOfMonth.toISOString().split('T')[0]
  const lastDate = lastDayOfMonth.toISOString().split('T')[0]

  return { firstDate, lastDate }
}

//  Функция для создания Excel файла и возврата его как потока данных
async function createExcelFileStream(data) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Отчёт')

  // Добавляем заголовки
  worksheet.columns = [
    { header: 'Станок', key: 'Станок', width: 15 },
    { header: 'Наименование', key: 'Наименование', width: 50 },
    { header: 'Наладчик', key: 'Нададчик', width: 20 },
    { header: 'Дата', key: 'Дата', width: 15 },
  ]

  // Добавляем данные
  data.forEach((item) => {
    worksheet.addRow(item)
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
  let htmlContent = `<h2>Отчет по наладкам</h2>`
  htmlContent += `<table border='1' style='border-collapse: collapse;'><tr>`
  htmlContent += `<th>Станок</th><th>Наименование</th><th>Наладчик</th><th>Дата</th>`
  htmlContent += `</tr>`

  data.forEach((item) => {
    htmlContent += `<tr>`
    htmlContent += `<td>${item.Станок}</td><td>${item.Наименование}</td><td>${item.Нададчик}</td><td>${item.Дата}</td>`
    htmlContent += `</tr>`
  })

  htmlContent += `</table>`
  return htmlContent
}

// Функция для отправки сообщения с файлом на почту
async function sendEmailWithExcelStream(email, text, excelStream, data) {
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
  })

  const { firstDate, lastDate } = getCurrentMonthDates()
  const envPrefix = process.env.NODE_ENV === 'development' ? 'development ' : ''
  const subject = `${envPrefix}Отчет по наладкам за неделю с ${firstDate} по ${lastDate}`

  const htmlContent = generateHtmlTable(data) // Генерация HTML

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: subject,
    text: text,
    html: htmlContent, // Вставка сгенерированного HTML
    attachments: [
      {
        filename: `Отчет по наладкам ${firstDate} - ${lastDate}.xlsx`,
        content: excelStream,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  }

  try {
    console.log(`\nОтчет по наладкам за неделю`)
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
async function genSetupReport(req, res) {
  try {
    console.log('--- genSetupReport() вызвана ---')
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('Bearer ')
    ) {
      res.status(400).send('Authorization token is missing or invalid.')
      return
    }

    const token = req.headers.authorization.split(' ')[1]
    console.log('Полученный токен (genSetupReport):', token)
    if (!token) {
      res.status(400).send('Bearer token is malformed.')
      return
    }

    const email = await getUserEmailByToken(token)
    console.log('Email пользователя (genSetupReport):', email)

    const data = await getReportData()
    console.log('Данные отчета (genSetupReport):', data)

    if (data.length === 0) {
      console.warn('Нет данных для отчета (genSetupReport).')
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
    console.error('Ошибка при генерации и отправке отчета:', error)
    res.status(500).send(`Ошибка: ${error.message}`)
  }
}

module.exports = { genSetupReport }
