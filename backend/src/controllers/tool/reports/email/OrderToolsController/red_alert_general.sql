WITH GroupTotals AS (
    SELECT group_id, SUM(sklad) AS group_sklad
    FROM dbo.tool_nom
    GROUP BY group_id
),
     ToolData AS (
         SELECT
             tool_nom.id AS id_tool,
             tool_nom.name,
             tool_nom.sklad,
             tool_nom.norma,
             tool_nom.norma_green,
             tool_nom.norma_red,
             tool_nom.group_id,
             tool_nom.group_standard,
             COALESCE(GroupTotals.group_sklad, 0) AS group_sklad -- Use COALESCE for null group_sklad
         FROM dbo.tool_nom
                  LEFT JOIN GroupTotals ON tool_nom.group_id = GroupTotals.group_id
     )
SELECT
    td.id_tool,
    td.name,
    td.sklad,
    td.norma,
    td.norma_green,
    td.norma_red,
    td.group_id,
    td.group_standard,
    td.group_sklad
FROM ToolData td
WHERE
    (
        (td.norma - td.sklad > 0) AND
        (td.norma_red > td.sklad) AND
        (td.group_id = 0 OR td.group_id IS NULL)
        )
   OR
    (
        (td.norma - td.sklad > 0 OR td.norma_green - td.sklad > 0) AND
        (
            (td.group_id <> 0 AND (td.norma - td.group_sklad) > 0) OR
            (td.group_id = 0 AND (td.norma_green > 0) AND (td.norma_red > 0))
            ) AND
        td.group_standard = 'true' AND
        td.norma_green IS NOT NULL AND
        td.norma_red > td.group_sklad
        );