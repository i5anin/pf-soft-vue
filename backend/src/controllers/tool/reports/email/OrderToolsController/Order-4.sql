WITH totals AS (
    SELECT group_id, SUM(sklad) AS group_total_sklad
    FROM dbo.tool_nom
    WHERE group_id IS NOT NULL AND group_id <> 0
    GROUP BY group_id
)
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    CASE
        WHEN tn.group_id IS NULL OR tn.group_id = 0 THEN tn.norma - tn.sklad
        ELSE 0
        END AS zakaz
FROM dbo.tool_nom tn
         LEFT JOIN totals t ON tn.group_id = t.group_id;