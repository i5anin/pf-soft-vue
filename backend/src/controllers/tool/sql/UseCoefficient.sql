WITH ToolUsage AS (
    SELECT
        CASE WHEN tn.group_standard THEN tn.group_id ELSE tn.id END AS tool_group_id,
        SUM(thn.quantity) AS total_taken,
        COUNT(*) AS usage_count
    FROM dbo.tool_history_nom thn
    JOIN dbo.tool_nom tn ON thn.id_tool = tn.id
    GROUP BY tool_group_id
),
TotalTaken AS (
    SELECT SUM(quantity) AS total_taken_all FROM dbo.tool_history_nom
)
SELECT
    tn.id AS tool_id,
    tn.name AS tool_name,
    tn.group_id,
    tn.group_standard,
    COALESCE(tu.usage_count, 0) AS usage_count,
    COALESCE(tu.total_taken, 0) AS total_taken,
    TotalTaken.total_taken_all,
    ROUND((COALESCE(tu.total_taken, 0)::DECIMAL / TotalTaken.total_taken_all) * 100, 4) AS taken_coefficient
FROM dbo.tool_nom tn
LEFT JOIN ToolUsage tu ON CASE WHEN tn.group_standard THEN tn.group_id ELSE tn.id END = tu.tool_group_id
CROSS JOIN TotalTaken
ORDER BY taken_coefficient DESC;