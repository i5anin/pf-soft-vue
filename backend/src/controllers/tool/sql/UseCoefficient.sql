WITH ToolUsage
         AS
         (SELECT CASE
                     WHEN dbo.tool_nom.group_standard
                         THEN dbo.tool_nom.group_id
                     ELSE dbo.tool_nom.id END AS tool_group_id,
                 SUM(vue_log.new_amount)      AS total_taken,
                 COUNT(*)                     AS usage_count
          FROM dbo.vue_log
                   JOIN dbo.tool_nom
                        ON vue_log.tool_id = tool_nom.id
          GROUP BY tool_group_id),
     TotalTaken AS (SELECT SUM(vue_log.new_amount)
                               AS total_taken_all
                    FROM dbo.vue_log)
SELECT tool_nom.id                                                                                AS tool_id,
       tool_nom.name                                                                              AS tool_name,
       tool_nom.group_id,
       tool_nom.group_standard,
       COALESCE(ToolUsage.usage_count, 0)                                                         AS usage_count,
       COALESCE(ToolUsage.total_taken, 0)                                                         AS total_taken,
       TotalTaken.total_taken_all,
       ROUND((COALESCE(ToolUsage.total_taken, 0)::DECIMAL / TotalTaken.total_taken_all) * 100, 4) AS taken_coefficient
FROM dbo.tool_nom
         LEFT JOIN ToolUsage ON
    CASE
        WHEN tool_nom.group_standard
            THEN tool_nom.group_id
        ELSE tool_nom.id
        END = ToolUsage.tool_group_id
         CROSS JOIN TotalTaken
ORDER BY taken_coefficient DESC;