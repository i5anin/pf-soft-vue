const { Pool } = require('pg')
const fs = require('fs')
const ExcelJS = require('exceljs')
const nodemailer = require('nodemailer')
const { emailConfig } = require('../../../../../../config/config')
const getDbConfig = require('../../../../../../config/databaseConfig')
const { format } = require('date-fns')
const cron = require('node-cron')

const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

async function getReportData() {
  const sql = fs.readFileSync(__dirname + '/OrderToolsController/5_general.sql', 'utf-8')
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

async function createExcelFileStream(data) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Отчёт')

  worksheet.columns = [
    { header: '# Excel', key: 'index', width: 5 },
    { header: 'ID', key: 'id_tool', width: 5 },
    { header: 'Название', key: 'name', width: 28, style: { font: { bold: true } } },
    { header: 'Склад группы', key: 'group_sum', width: 20 },
    { header: 'На складе', key: 'sklad', width: 10 },
    { header: 'Норма', key: 'norma', width: 10 },
    { header: 'Норма Зеленая', key: 'norma_green', width: 30 },
    { header: 'Норма Красная', key: 'norma_red', width: 30 },
  ]

  let index = 1
  data.forEach((item) => {
    worksheet.addRow({
      index: index++,
      id_tool: item.id_tool,
      name: item.name,
      sklad: Number(item.sklad) || 0,
      norma: Number(item.norma) || '',
      group_display: Number(item.group_display) || '',
      group_standard: item.group_standard ? 'Да' : 'Нет',
      tool_path: item.tool_path || 'Не указан',
      group_sum: Number(item.group_sum) || '',
      norma_green: item.norma_green,
      norma_red: item.norma_red,
    })
  })

  worksheet.columns.forEach((column) => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellLength = cell.value ? cell.value.toString().length : 10
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

function generateHtmlTable(data) {
  const headers = [
    { header: '# HTML', key: 'index' },
    { header: 'ID', key: 'id_tool' },
    { header: 'Название', key: 'name' },
    { header: 'Склад группы', key: 'group_sum' },
    { header: 'На складе', key: 'sklad' },
    { header: 'Норма', key: 'norma' },
    { header: 'Группа ID', key: 'group_display' },
    { header: 'Стандарт', key: 'group_standard' },
    { header: 'Норма Зеленая', key: 'norma_green' },
    { header: 'Норма Красная', key: 'norma_red' },
  ]

  const currentDateTime = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  let htmlContent = `<h2>Критически мало инструмента ${currentDateTime}</h2>`
  htmlContent += `<table border='1' style='border-collapse: collapse;'><tr>`

  headers.forEach((header) => {
    htmlContent += `<th>${header.header}</th>`
  })

  htmlContent += `</tr>`

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

async function sendEmailWithExcelStream(emails, text, excelStream, data) {
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: { user: emailConfig.user, pass: emailConfig.pass },
  })

  const envPrefix = process.env.NODE_ENV === 'development' ? 'development ' : ''
  const currentDateTime = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
  const subject = `${envPrefix}Заказ: Журнал инструмента ${currentDateTime}`

  const htmlContent = generateHtmlTable(data)

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: emails.join(', '), // Отправка на несколько адресов
    subject: subject,
    text: text,
    html: htmlContent,
    attachments: [
      {
        filename: `Заказ инструмента ${currentDateTime}.xlsx`,
        content: excelStream,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  }

  try {
    console.log('\nКритически мало инструмента')
    console.log(`Отчет будет отправлен на email: ${emails.join(', ')}`)
    await transporter.sendMail(mailOptions)
    console.log(`Отчет успешно отправлен на email: ${emails.join(', ')}.\n`)
  } catch (error) {
    console.error('Ошибка при отправке письма:', error)
    throw error
  }
}

async function genRedAlert(req, res) {
  try {
    const data = await getReportData()
    if (data.length === 0) {
      return res.status(404).send('No data available for the report.')
    }

    const excelStream = await createExcelFileStream(data)
    const emailText = 'Please find the attached Excel report.'

    // Получаем список email адресов редакторов из базы данных
    const query = "SELECT email FROM dbo.vue_users WHERE role = 'Editor'"
    const { rows } = await pool.query(query)
    const editorEmails = rows.map((row) => row.email)

    if (editorEmails.length > 0) {
      await sendEmailWithExcelStream(editorEmails, emailText, excelStream, data)
      res.status(200).send('The report has been successfully sent to the specified emails.')
    } else {
      console.log('No editors found in the database.')
      res.status(400).send('No editors found in the database.')
    }
  } catch (error) {
    console.error('Error in generating and sending the report:', error)
    res.status(500).send(`Error in generating and sending the report: ${error.message}`)
  }
}

// Запускаем проверку каждые 20 минут
cron.schedule('0 9 * * 1-5', genRedAlert)

module.exports = { genRedAlert }
