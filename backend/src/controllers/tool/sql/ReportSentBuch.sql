
SELECT dbo.specs_nom.id,
       dbo.specs_nom.name,
       dbo.specs_nom.description,
       dbo.specs_nom.prod_end_time,
       dbo.tool_part_archive.date_report_sent_buch,
       dbo.tool_part_archive.report_sent_buch,
       dbo.tool_part_archive.count_nom
FROM dbo.tool_part_archive
RIGHT JOIN dbo.specs_nom ON dbo.tool_part_archive.specs_nom_id = dbo.specs_nom.id
WHERE  dbo.specs_nom.prod_end_time >= '2024-06-18 00:00:00'
ORDER BY dbo.tool_part_archive.date_report_sent_buch DESC;
