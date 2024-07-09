-- заказ группа инструмента "1 норма" "в группе"
SELECT tool_nom.id                     AS id_tool,
       tool_nom.name,
       -- заказ
       tool_nom.norma - tool_nom.sklad AS zakaz,
       tool_nom.sklad,
       tool_nom.norma,
       -- группа
       tool_nom.group_id,
       tool_nom.group_standard,
       -- 3 нормы
       tool_nom.norma_green,
       tool_nom.norma_red
FROM dbo.tool_nom
WHERE tool_nom.norma - tool_nom.sklad > 0
  AND (group_id <> 0
    AND tool_nom.group_standard
    --AND (tool_nom.norma_green ISNULL OR tool_nom.norma_green = 0)
    --AND (tool_nom.norma_red ISNULL OR tool_nom.norma_red = 0)
    AND tool_nom.norma_red ISNULL);
