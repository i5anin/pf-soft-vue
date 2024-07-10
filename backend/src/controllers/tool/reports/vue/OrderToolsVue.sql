WITH RECURSIVE
    TreePath AS (SELECT id, name, parent_id, name AS path
                 FROM dbo.tool_tree
                 WHERE parent_id = 1
                 UNION ALL
                 SELECT tt.id, tt.name, tt.parent_id, CONCAT(tp.path, ' / ', tt.name)
                 FROM dbo.tool_tree tt
                          JOIN TreePath tp ON tt.parent_id = tp.id),
    totals AS (SELECT group_id, SUM(sklad) AS group_total_sklad
               FROM dbo.tool_nom
               GROUP BY group_id),
    damaged AS (SELECT tn.id               AS id_tool,
                       tn.parent_id,
                       tn.group_id,
                       tn.group_standard,
                       tn.name,
                       tn.sklad,
                       tn.norma,
                       tn.norma_green,
                       tn.norma_red,
                       CASE
                           WHEN t.group_total_sklad > 0
                               THEN GREATEST(CASE WHEN tn.norma_green > 0 THEN tn.norma_green ELSE tn.norma END -
                                             t.group_total_sklad, 0)
                           ELSE GREATEST(CASE WHEN tn.norma_green > 0 THEN tn.norma_green ELSE tn.norma END - tn.sklad,
                                         0)
                           END             AS zakaz,
                       t.group_total_sklad AS group_sklad
                FROM dbo.tool_nom tn
                         LEFT JOIN dbo.tool_history_damaged thd ON tn.id = thd.id_tool
                    AND thd.timestamp >= CURRENT_DATE - INTERVAL '7 days'
                         LEFT JOIN totals t ON tn.group_id = t.group_id
                WHERE CASE
                          WHEN t.group_total_sklad > 0
                              THEN
                              CASE WHEN tn.norma_green > 0 THEN tn.norma_green ELSE tn.norma END - t.group_total_sklad >
                              0
                          ELSE CASE WHEN tn.norma_green > 0 THEN tn.norma_green ELSE tn.norma END - tn.sklad > 0
                          END
                GROUP BY tn.id, tn.parent_id, tn.name, tn.sklad, tn.norma, tn.group_id,
                         tn.group_standard, t.group_total_sklad, tn.norma_green, tn.norma_red),
    ToolUsage
        AS (SELECT CASE WHEN tn.group_standard THEN tn.group_id ELSE tn.id END AS tool_group_id, -- Группируем по group_id, если инструмент эталонный
                   SUM(vl.new_amount)                                          AS total_taken
            FROM dbo.vue_log vl
                     JOIN dbo.tool_nom tn ON vl.tool_id = tn.id
            WHERE vl.datetime_log >= CURRENT_DATE - INTERVAL '14 days'
            GROUP BY tool_group_id),
    TotalTaken AS (SELECT SUM(new_amount) as total_taken_all
                   FROM dbo.vue_log
                   WHERE datetime_log >= CURRENT_DATE - INTERVAL '14 days')
SELECT d.parent_id,
       tp.path,
       JSON_AGG(
               JSON_BUILD_OBJECT(
                       'id_tool', d.id_tool,
                       'name', d.name,
                       'sklad', d.sklad,
                       'norma', d.norma,
                       'norma_green', d.norma_green,
                       'norma_red', d.norma_red,
                       'zakaz', d.zakaz,
                       'group_id', d.group_id,
                       'group_standard', d.group_standard,
                       'group_sklad', d.group_sklad,
                       'total_taken', COALESCE(tu.total_taken, 0),
                       'taken_coefficient', (COALESCE(tu.total_taken, 0)::DECIMAL / tt.total_taken_all) * 100
               )
       ) AS tools
FROM damaged d
         JOIN
     TreePath tp ON d.parent_id = tp.id
         LEFT JOIN
     ToolUsage tu ON CASE WHEN d.group_standard THEN d.group_id ELSE d.id_tool END =
                     tu.tool_group_id -- Используем tool_group_id для объединения
         CROSS JOIN
     TotalTaken tt
GROUP BY d.parent_id, tp.path
HAVING SUM(d.zakaz) > 0
ORDER BY tp.path;