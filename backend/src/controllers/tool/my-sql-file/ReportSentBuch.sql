SELECT dbo.specs_nom.id,                            -- ID Спецификации
       dbo.specs_nom.name,                          -- Название спецификации
       dbo.specs_nom.description,                   -- Описание спецификации
       dbo.specs_nom.prod_end_time,                 -- Время окончания производства
       dbo.tool_part_archive.date_report_sent_buch, -- Дата отправки отчета в бухгалтерию
       dbo.tool_part_archive.report_sent_buch,      -- Отчет отправлен в бухгалтерию (флаг)
       dbo.tool_part_archive.count_nom              -- Количество номенклатуры
FROM dbo.tool_part_archive
         RIGHT JOIN dbo.specs_nom ON dbo.tool_part_archive.specs_nom_id = dbo.specs_nom.id
WHERE dbo.specs_nom.prod_end_time >= '2024-06-18 00:00:00'
ORDER BY dbo.tool_part_archive.date_report_sent_buch DESC; 