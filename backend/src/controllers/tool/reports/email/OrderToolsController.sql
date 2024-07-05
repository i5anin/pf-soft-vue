WITH RECURSIVE
    TreePath AS (
        SELECT id, CAST(name AS TEXT) AS path, parent_id
        FROM dbo.tool_tree
        WHERE parent_id = 1
        UNION ALL
        SELECT tt.id, CONCAT(tp.path, ' / ', tt.name) AS path, tt.parent_id
        FROM dbo.tool_tree tt
                 JOIN TreePath tp ON tt.parent_id = tp.id
    ),
    totals AS (
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
    tp.path AS tool_path,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    t.group_total_sklad AS group_sum,
    tn.norma_red,
    tn.norma_green,
    CASE
        WHEN tn.group_id IS NOT NULL AND tn.group_id <> 0 THEN
            tn.norma - t.group_total_sklad
        ELSE
            tn.norma - tn.sklad
        END AS zakaz
FROM dbo.tool_nom tn
         LEFT JOIN totals t ON tn.group_id = t.group_id
         LEFT JOIN TreePath tp ON tn.parent_id = tp.id
WHERE (
    tn.group_id = 0
        OR tn.group_id IS NULL
        OR tn.group_standard IS TRUE
    )
  AND (
    (tn.group_id IS NOT NULL AND tn.group_id <> 0 AND (tn.norma - t.group_total_sklad) > 0) OR
    (tn.norma_green IS NOT NULL AND tn.norma_red IS NOT NULL AND (tn.norma_green - tn.sklad) > 0 AND tn.sklad < tn.norma) OR
    ((tn.norma - tn.sklad) > 0)
    )
ORDER BY tp.path, tn.name;
