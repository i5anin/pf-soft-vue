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
        WHEN TreePath.path LIKE '%Пластины%' THEN CEIL((tool_nom.norma_green - tool_nom.sklad) / 10) * 10
        ELSE tool_nom.norma_green - tool_nom.sklad 
    END AS zakaz,
    tool_nom.sklad,
    tool_nom.norma,
    tool_nom.norma_green,
    tool_nom.norma_red,
    ROUND((tool_nom.norma_green - tool_nom.sklad) * 100::numeric / tool_nom.norma_green, 0) AS percent_missing,
    TreePath.path AS tool_path,
    CASE 
        WHEN TreePath.path LIKE '%Пластины%' THEN 'true' 
        ELSE ''
    END AS is_plate
FROM dbo.tool_nom
JOIN TreePath ON tool_nom.parent_id = TreePath.id
WHERE tool_nom.norma - tool_nom.sklad > 0
  AND tool_nom.norma_green <> 0
  AND tool_nom.norma_red <> 0
  AND (group_id = 0 OR group_id IS NULL);