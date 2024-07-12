WITH GroupTotals AS (SELECT group_id, SUM(sklad) AS group_sklad
                     FROM dbo.tool_nom
                     GROUP BY group_id)
SELECT tool_nom.id AS id_tool,
       tool_nom.name,
       CASE
           WHEN tool_nom.is_plate THEN
               CASE
                   WHEN tool_nom.group_id <> 0 THEN CEIL((tool_nom.norma - GroupTotals.group_sklad) / 10) * 10
                   WHEN tool_nom.norma_green <> 0 AND tool_nom.norma_red <> 0
                       THEN CEIL((tool_nom.norma_green - tool_nom.sklad) / 10) * 10
                   ELSE CEIL((tool_nom.norma - tool_nom.sklad) / 10) * 10
                   END
           ELSE
               CASE
                   WHEN tool_nom.group_id <> 0 THEN tool_nom.norma - GroupTotals.group_sklad
                   WHEN tool_nom.norma_green <> 0 AND tool_nom.norma_red <> 0 THEN tool_nom.norma_green - tool_nom.sklad
                   ELSE tool_nom.norma - tool_nom.sklad
                   END
           END     AS zakaz,
       tool_nom.sklad,
       tool_nom.norma,
       tool_nom.norma_green,
       tool_nom.norma_red,
       tool_nom.group_id,
       tool_nom.group_standard,
       GroupTotals.group_sklad,
       tool_nom.is_plate
FROM dbo.tool_nom
         LEFT JOIN GroupTotals ON tool_nom.group_id = GroupTotals.group_id
WHERE (
    (tool_nom.group_id <> 0 AND tool_nom.norma - COALESCE(GroupTotals.group_sklad, 0) > 0) OR
    (tool_nom.group_id = 0 AND
     (
         (tool_nom.norma_green <> 0 AND tool_nom.norma_red <> 0) OR
         (tool_nom.norma - tool_nom.sklad > 0)
         )
        )
    )
  AND (
    CASE
        WHEN tool_nom.group_id <> 0 THEN tool_nom.norma - COALESCE(GroupTotals.group_sklad, 0)
        WHEN tool_nom.norma_green <> 0 AND tool_nom.norma_red <> 0 THEN tool_nom.norma_green - tool_nom.sklad
        ELSE tool_nom.norma - tool_nom.sklad
        END > 0
    )
  AND (tool_nom.group_standard = 'true' OR tool_nom.group_id = 0 OR tool_nom.group_id IS NULL);
