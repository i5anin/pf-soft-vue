-- 4.группы 3 нормы
SELECT tool_nom.id AS id_tool,
       tool_nom.name,
       CASE
           WHEN tool_nom.group_id <> 0
               THEN tool_nom.norma - group_totals.group_sklad
           ELSE tool_nom.norma_green - tool_nom.sklad
           END AS zakaz,
       tool_nom.sklad,
       tool_nom.norma,
       tool_nom.norma_green,
       tool_nom.norma_red,
       tool_nom.group_id,
       tool_nom.group_standard,
       group_totals.group_sklad
FROM dbo.tool_nom
LEFT JOIN (
    SELECT group_id, SUM(sklad) AS group_sklad
    FROM dbo.tool_nom
    GROUP BY group_id
) AS group_totals ON tool_nom.group_id = group_totals.group_id
WHERE (tool_nom.norma - tool_nom.sklad > 0 OR tool_nom.norma_green - tool_nom.sklad > 0)
  AND (
    (tool_nom.group_id <> 0 AND (tool_nom.norma - group_totals.group_sklad) > 0) OR
    (tool_nom.group_id = 0 AND (tool_nom.norma_green > 0) AND (tool_nom.norma_red > 0))
  )
  AND (CASE
           WHEN tool_nom.group_id <> 0
               THEN tool_nom.norma - group_totals.group_sklad
           ELSE tool_nom.norma_green - tool_nom.sklad
       END) > 0
  AND tool_nom.group_standard = 'true'; -- Добавлено условие group_standard = true 