WITH ToolUsage AS (SELECT CASE
                              WHEN tn.group_standard THEN tn.group_id
                              ELSE tn.id
                              END           AS tool_group_id, -- ID группы или инструмента
                          SUM(thn.quantity) AS total_taken,   --  Количество взятых
                          COUNT(*)          AS usage_count    --  Количество операций взятия
                   FROM dbo.tool_history_nom thn
                            JOIN dbo.tool_nom tn ON thn.id_tool = tn.id
                   GROUP BY tool_group_id),
     TotalTaken AS (SELECT SUM(quantity) AS total_taken_all -- Общее количество взятых
                    FROM dbo.tool_history_nom)
SELECT dbo.tool_nom.id,                    -- ID инструмента
       dbo.tool_nom.name,                  -- Название инструмента
       dbo.tool_nom.group_id,
       dbo.tool_nom.group_standard,
       COALESCE(ToolUsage.usage_count, 0), -- Количество операций взятия
       COALESCE(ToolUsage.total_taken, 0), --  Количество взятых
       TotalTaken.total_taken_all,         --  Общее количество взятых
       ROUND((COALESCE(ToolUsage.total_taken, 0)::DECIMAL / TotalTaken.total_taken_all) * 100,
             4)                            -- Коэффициент использования
FROM dbo.tool_nom
         LEFT JOIN ToolUsage ON
    CASE
        WHEN dbo.tool_nom.group_standard THEN dbo.tool_nom.group_id
        ELSE dbo.tool_nom.id
        END = ToolUsage.tool_group_id
         CROSS JOIN TotalTaken
ORDER BY ROUND((COALESCE(ToolUsage.total_taken, 0)::DECIMAL / TotalTaken.total_taken_all) * 100, 4) DESC;