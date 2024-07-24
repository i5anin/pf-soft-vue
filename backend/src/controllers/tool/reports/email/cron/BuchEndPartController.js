const nodemailer = require('nodemailer')
const { Pool } = require('pg')
const { emailConfig } = require('../../../../../config/config')
const { htmlToText } = require('nodemailer-html-to-text')
const getEmailRecipients = require('../getEmailRecipients')
const getDbConfig = require('../../../../../config/databaseConfig')
const cron = require('node-cron')

const dbConfig = getDbConfig()
const pool = new Pool(dbConfig)

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: false,
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass,
  },
})

transporter.use('compile', htmlToText())

// Измененная функция createMailContent
function createMailContent(tools, partId, partName, partDesignation) {
  let htmlContent = `<h2>Отчет по инструментам, завершение партии: ${partId} (${partName} - ${partDesignation})</h2>`

  if (tools.length > 0) {
    htmlContent += `
      <table border='1'>
        <tr>
          <th>Индекс</th>
          <th>ID инструмента</th>
          <th>Название инструмента</th>
          <th>Количество</th>
        </tr>
    `
    tools.forEach((tool, index) => {
      htmlContent += `
        <tr>
          <td>${index + 1}</td>
          <td>${tool.id_tool}</td>
          <td>${tool.tool_name}</td>
          <td>${tool.total_quantity}</td>
        </tr>
      `
    })
    htmlContent += `</table>`
  } else {
    htmlContent += '<p>Инструменты для данной партии не найдены.</p>'
  }

  return htmlContent
}

async function sendReportForPart(partId) {
  try {
    // Получаем данные о партии, включая название и обозначение
    const partDataResult = await pool.query(
      `
        SELECT name, description
        FROM dbo.specs_nom
        WHERE id = $1
      `,
      [partId]
    )

    if (partDataResult.rows.length === 0) {
      console.log(`Партия с ID ${partId} не найдена.`)
      return
    }

    const partName = partDataResult.rows[0].name
    const partDesignation = partDataResult.rows[0].description

    const toolsResult = await pool.query(
      `
        SELECT thn.id_tool,
               tn.name           AS tool_name,
               SUM(thn.quantity) AS total_quantity
        FROM dbo.tool_history_nom thn
               JOIN dbo.tool_nom tn ON thn.id_tool = tn.id
        WHERE thn.specs_nom_id = $1
          AND thn.quantity > 0
        GROUP BY thn.id_tool, tn.name
        ORDER BY thn.id_tool
      `,
      [partId]
    )

    const tools = toolsResult.rows

    if (tools.length === 0) {
      console.log(`Нет инструментов для отправки отчета по партии: ${partId}`)
      return
    }

    const htmlContent = createMailContent(tools, partId, partName, partDesignation)

    // Получаем email адреса для роли finance в build-режиме
    let financeUserEmail
    if (process.env.VITE_NODE_ENV === 'build') {
      financeUserEmail = await getEmailRecipients('finance')
      if (!financeUserEmail) {
        console.error(
          "Не удалось получить адрес электронной почты для роли 'finance'."
        )
        return
      }
    }

    let mailOptions = {
      from: process.env.MAIL_USER,
      to: financeUserEmail,
      subject: `Отчет по инструментам, завершение партии: ${partId} (${partName} - ${partDesignation})`,
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(
      `Отчет по инструментам, завершение партии ${partId} (${partName} - ${partDesignation}) отправлен на ${financeUserEmail}`
    )
  } catch (error) {
    console.error(`Ошибка при отправке отчета для партии ${partId}:`, error)
  }
}

async function checkStatusChanges() {
  try {
    const result = await pool.query(
      `
        SELECT sn.id AS part_id,
               sn.prod_end_time,
               tpa.report_sent_buch
        FROM dbo.specs_nom sn
               LEFT JOIN dbo.tool_part_archive tpa ON tpa.specs_nom_id = sn.id
        WHERE sn.prod_end_time >= '2024-06-19 00:00:00'
          AND (tpa.report_sent_buch IS NULL OR tpa.report_sent_buch = FALSE)
        ORDER BY sn.id DESC, sn.prod_end_time DESC
        LIMIT 1
      `
    )

    if (result.rows.length > 0) {
      const partId = result.rows[0].part_id
      const reportSent = result.rows[0].report_sent_buch

      // Сначала отправляем отчет
      await sendReportForPart(partId)

      // Затем обновляем или добавляем запись в tool_part_archive
      if (reportSent !== null) {
        // Обновляем статус отправки
        await pool.query(
          `
            UPDATE dbo.tool_part_archive
            SET report_sent_buch      = TRUE,
                date_report_sent_buch = CURRENT_TIMESTAMP,
                count_nom             = (SELECT COUNT(*) FROM dbo.tool_history_nom WHERE specs_nom_id = $1) -- Подсчет записей в tool_history_nom
            WHERE specs_nom_id = $1
          `,
          [partId]
        )
        console.log(`Статус отправки отчета для партии ${partId} обновлен.`)
      } else {
        // Проверяем, существует ли запись с таким же specs_nom_id
        const existingRecord = await pool.query(
          `
            SELECT 1
            FROM dbo.tool_part_archive
            WHERE specs_nom_id = $1
          `,
          [partId]
        )

        if (existingRecord.rows.length > 0) {
          // Обновляем существующую запись
          await pool.query(
            `
              UPDATE dbo.tool_part_archive
              SET report_sent_buch      = TRUE,
                  date_report_sent_buch = CURRENT_TIMESTAMP,
                  count_nom             = (SELECT COUNT(*) FROM dbo.tool_history_nom WHERE specs_nom_id = $1)
              WHERE specs_nom_id = $1
            `,
            [partId]
          )
          console.log(`Запись для партии ${partId} обновлена в tool_part_archive.`)
        } else {
          // Добавляем новую запись
          await pool.query(
            `
              INSERT INTO dbo.tool_part_archive (specs_nom_id, report_sent_buch, date_report_sent_buch, count_nom)
              VALUES ($1, TRUE, CURRENT_TIMESTAMP, (SELECT COUNT(*) FROM dbo.tool_history_nom WHERE specs_nom_id = $1))
            `,
            [partId]
          )
          console.log(`Запись для партии ${partId} добавлена в tool_part_archive.`)
        }
      }
    } else {
      console.log('Нет партий для отправки отчетов.')
    }
  } catch (error) {
    console.error('Ошибка при проверке статусов:', error)
  }
}

// Запускаем проверку каждые 20 минут
cron.schedule('0 */20 * * * *', checkStatusChanges)

module.exports = { checkStatusChanges }
