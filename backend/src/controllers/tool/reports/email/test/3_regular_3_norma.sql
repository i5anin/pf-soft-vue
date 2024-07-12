SELECT tool_nom.id                     AS id_tool,
       tool_nom.name,
       -- заказ
       CASE
           WHEN tool_nom.is_plate THEN CEIL((tool_nom.norma_green - tool_nom.sklad) / 10) * 10
           ELSE tool_nom.norma_green - tool_nom.sklad
           END AS zakaz,
       tool_nom.sklad,
       tool_nom.norma,
       -- 3 нормы
       tool_nom.norma_green,
       tool_nom.norma_red,
       tool_nom.is_plate
FROM dbo.tool_nom
WHERE tool_nom.norma - tool_nom.sklad > 0
  AND (tool_nom.norma_green <> 0)
  AND (tool_nom.norma_red <> 0)
  AND (group_id = 0 OR group_id IS NULL);