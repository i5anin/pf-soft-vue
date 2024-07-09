-- группы
SELECT tool_nom.id                               AS id_tool,
       tool_nom.name,
       tool_nom.norma - group_totals.group_sklad AS zakaz,
       tool_nom.sklad,
       tool_nom.norma,
       tool_nom.group_id,
       tool_nom.group_standard,
       group_totals.group_sklad
FROM dbo.tool_nom
         LEFT JOIN (SELECT group_id,
                           SUM(sklad) AS group_sklad
                    FROM dbo.tool_nom
                    GROUP BY group_id)
    AS group_totals ON tool_nom.group_id = group_totals.group_id
WHERE tool_nom.norma - tool_nom.sklad > 0
  AND tool_nom.group_id <> 0
  AND (tool_nom.norma - group_totals.group_sklad) > 0;
