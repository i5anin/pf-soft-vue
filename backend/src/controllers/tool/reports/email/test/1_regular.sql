SELECT tool_nom.id AS id_tool,
       tool_nom.name,
       CASE
           WHEN tool_nom.is_plate THEN CEIL((tool_nom.norma - tool_nom.sklad) / 10) * 10
           ELSE tool_nom.norma - tool_nom.sklad
           END     AS zakaz,
       tool_nom.sklad,
       tool_nom.norma,
       tool_nom.group_id,
       tool_nom.group_standard,
       tool_nom.is_plate
FROM dbo.tool_nom
WHERE tool_nom.norma - tool_nom.sklad > 0
  AND (group_id = 0 OR group_id IS NULL)
  AND (CASE
           WHEN tool_nom.is_plate THEN CEIL((tool_nom.norma - tool_nom.sklad) / 10) * 10
           ELSE tool_nom.norma - tool_nom.sklad
    END) > 0; -- Условие zakaz > 0