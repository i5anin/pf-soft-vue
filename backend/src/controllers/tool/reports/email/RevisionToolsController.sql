WITH RECURSIVE
    TreePath AS (SELECT id, CAST(name AS TEXT) AS path, parent_id
                 FROM dbo.tool_tree
                 WHERE parent_id = 1
                 UNION ALL
                 SELECT tool_tree.id, CONCAT(TreePath.path, ' / ', tool_tree.name) AS path, tool_tree.parent_id
                 FROM dbo.tool_tree
                          JOIN TreePath ON tool_tree.parent_id = TreePath.id),
    totals AS (SELECT group_id, SUM(sklad) AS group_total_sklad
               FROM dbo.tool_nom
               WHERE group_id IS NOT NULL
                 AND group_id <> 0
               GROUP BY group_id),
    damaged AS (SELECT tool_nom.id              AS id_tool,
                       tool_nom.name,
                       tool_nom.sklad,
                       tool_nom.norma,
                       tool_nom.parent_id,
                       tool_nom.group_id,
                       tool_nom.group_standard,
                       CASE
                           WHEN tool_nom.group_id IS NOT NULL AND tool_nom.group_id <> 0 THEN
                               GREATEST(tool_nom.norma - totals.group_total_sklad, 0)
                           ELSE
                               GREATEST(tool_nom.norma - tool_nom.sklad, 0)
                           END                  AS zakaz,
                       totals.group_total_sklad AS group_sum
                FROM dbo.tool_nom
                         LEFT JOIN totals ON tool_nom.group_id = totals.group_id
                GROUP BY tool_nom.id, tool_nom.parent_id, tool_nom.name, tool_nom.sklad, tool_nom.norma,
                         tool_nom.group_id,
                         tool_nom.group_standard, totals.group_total_sklad)
SELECT tool_nom.id                    AS id_tool,
       tool_nom.name,
       tool_nom.sklad,
       tool_nom.norma,
       tool_nom.parent_id,
       tool_nom.group_id,
       tool_nom.group_standard,
       TreePath.path                  AS tool_path,
       COALESCE(damaged.zakaz, 0)     AS zakaz,
       COALESCE(damaged.group_sum, 0) AS group_sum,
       tool_nom.norma_green,
       tool_nom.norma_red
FROM dbo.tool_nom
         LEFT JOIN TreePath ON tool_nom.parent_id = TreePath.id
         LEFT JOIN damaged ON tool_nom.id = damaged.id_tool
ORDER BY TreePath.path, tool_nom.name;