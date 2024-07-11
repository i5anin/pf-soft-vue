WITH RECURSIVE TreePath AS (
    SELECT
        id,
        name,
        parent_id,
        name AS path
    FROM dbo.tool_tree
    WHERE parent_id = 1

    UNION ALL

    SELECT
        tool_tree.id,
        tool_tree.name,
        tool_tree.parent_id,
        CONCAT(TreePath.path, ' / ', tool_tree.name)
    FROM dbo.tool_tree
    JOIN TreePath ON tool_tree.parent_id = TreePath.id
)
SELECT
    tool_nom.id AS id_tool,
    tool_nom.name,
    CASE
        WHEN TreePath.path LIKE '%Пластины%' THEN CEIL((tool_nom.norma - group_totals.group_sklad) / 10) * 10
        ELSE tool_nom.norma - group_totals.group_sklad
    END AS zakaz,
    tool_nom.sklad,
    tool_nom.norma,
    tool_nom.group_id,
    tool_nom.group_standard,
    group_totals.group_sklad,
    ROUND((tool_nom.norma - group_totals.group_sklad) * 100::numeric / tool_nom.norma, 0) AS percent_missing,
    TreePath.path AS tool_path,
    CASE
        WHEN TreePath.path LIKE '%Пластины%' THEN 'true'
        ELSE ''
    END AS is_plate
FROM dbo.tool_nom
LEFT JOIN (
    SELECT group_id, SUM(sklad) AS group_sklad
    FROM dbo.tool_nom
    GROUP BY group_id
) AS group_totals ON tool_nom.group_id = group_totals.group_id
JOIN TreePath ON tool_nom.parent_id = TreePath.id -- Присоединяем TreePath
WHERE tool_nom.norma - tool_nom.sklad > 0
  AND tool_nom.group_id <> 0
  AND (tool_nom.norma - group_totals.group_sklad) > 0;