WITH ToolUsage
         AS (SELECT CASE WHEN tn.group_standard THEN tn.group_id ELSE tn.id END AS tool_group_id, -- Группируем по group_id, если инструмент эталонный
                    SUM(vl.new_amount)                                          AS total_taken,
                    COUNT(*)                                                    AS usage_count
             FROM dbo.vue_log vl
                      JOIN dbo.tool_nom tn ON vl.tool_id = tn.id
             GROUP BY tool_group_id),
     TotalTaken AS (SELECT SUM(new_amount) AS total_taken_all FROM dbo.vue_log)
SELECT tn.id                                                             AS tool_id,
       tn.name                                                           AS tool_name,
       tn.group_id,
       tn.group_standard,
       COALESCE(tu.usage_count, 0)                                       AS usage_count,
       COALESCE(tu.total_taken, 0)                                       AS total_taken,
       tt.total_taken_all,
       (COALESCE(tu.total_taken, 0)::DECIMAL / tt.total_taken_all) * 100 AS taken_coefficient
FROM dbo.tool_nom tn
         LEFT JOIN ToolUsage tu ON CASE WHEN tn.group_standard THEN tn.group_id ELSE tn.id END =
                                   tu.tool_group_id -- Объединяем по group_id, если инструмент эталонный
         CROSS JOIN TotalTaken tt
ORDER BY taken_coefficient DESC;
