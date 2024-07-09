-- заказ обычный инструмент "1 норма" "нет группы"
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
  AND (group_id = 0 OR group_id isnull);
