WITH RECURSIVE
    TreePath AS (SELECT id, CAST(name AS TEXT) AS path, parent_id
                 FROM dbo.tool_tree
                 WHERE parent_id = 1
                 UNION ALL
                 SELECT tt.id, CONCAT(tp.path, ' / ', tt.name) AS path, tt.parent_id
                 FROM dbo.tool_tree tt
                          JOIN TreePath tp ON tt.parent_id = tp.id),
    totals AS (
        SELECT group_id, SUM(sklad) AS group_total_sklad
        FROM dbo.tool_nom
        WHERE group_id IS NOT NULL AND group_id <> 0
        GROUP BY group_id
    ),
    damaged AS (
        SELECT tn.id AS id_tool,
               tn.name,
               tn.sklad,
               tn.norma,
               tn.parent_id,
               tn.group_id,
               tn.group_standard,
               CASE
                   WHEN tn.group_id IS NOT NULL AND tn.group_id <> 0 THEN
                       GREATEST(tn.norma - t.group_total_sklad, 0)
                   ELSE
                       GREATEST(tn.norma - tn.sklad, 0)
                   END AS zakaz,
               COALESCE(SUM(thd.quantity), 0) AS damaged_last_7_days,
               t.group_total_sklad AS group_sum
        FROM dbo.tool_nom tn
                 LEFT JOIN dbo.tool_history_damaged thd ON tn.id = thd.id_tool AND thd.timestamp >= CURRENT_DATE - INTERVAL '7 days'
                 LEFT JOIN totals t ON tn.group_id = t.group_id
        GROUP BY tn.id, tn.parent_id, tn.name, tn.sklad, tn.norma, tn.group_id, tn.group_standard, t.group_total_sklad
        HAVING CASE
                   WHEN tn.group_id IS NOT NULL AND tn.group_id <> 0 THEN
                       GREATEST(tn.norma - t.group_total_sklad, 0)
                   ELSE
                       GREATEST(tn.norma - tn.sklad, 0)
                   END > 0
    )
SELECT d.id_tool,
       d.name,
       d.sklad,
       d.norma,
       d.zakaz,
       tp.path AS tool_path,
       CASE
           WHEN d.group_id IS NULL THEN '0'
           ELSE d.group_id
           END AS group_display,
       d.group_standard,
       d.group_sum
FROM damaged d
         LEFT JOIN TreePath tp ON d.parent_id = tp.id
ORDER BY tp.path, d.name;