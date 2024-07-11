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
        WHEN TreePath.path LIKE '%Пластины%' THEN 
            CASE 
                WHEN tool_nom.group_id <> 0 THEN CEIL((tool_nom.norma - group_totals.group_sklad) / 10) * 10
                ELSE CEIL((tool_nom.norma_green - tool_nom.sklad) / 10) * 10
            END
        ELSE 
            CASE
                WHEN tool_nom.group_id <> 0 THEN tool_nom.norma - group_totals.group_sklad
                ELSE tool_nom.norma_green - tool_nom.sklad
            END
    END AS zakaz,
    tool_nom.sklad,
    tool_nom.norma,
    tool_nom.norma_green,
    tool_nom.norma_red,
    tool_nom.group_id,
    tool_nom.group_standard,
    group_totals.group_sklad,
    ROUND(
        (CASE
            WHEN tool_nom.group_id <> 0 THEN tool_nom.norma - group_totals.group_sklad
            ELSE tool_nom.norma_green - tool_nom.sklad
        END) * 100::numeric / tool_nom.norma_green, 0
    ) AS percent_missing,
    TreePath.path AS tool_path,
    CASE 
        WHEN TreePath.path LIKE '%Пластины%' THEN 'true' 
        ELSE 'false' 
    END AS is_plate
FROM dbo.tool_nom
LEFT JOIN (
    SELECT group_id, SUM(sklad) AS group_sklad
    FROM dbo.tool_nom
    GROUP BY group_id
) AS group_totals ON tool_nom.group_id = group_totals.group_id
JOIN TreePath ON tool_nom.parent_id = TreePath.id
WHERE (tool_nom.norma - tool_nom.sklad > 0 OR tool_nom.norma_green - tool_nom.sklad > 0)
  AND (
      (tool_nom.group_id <> 0 AND (tool_nom.norma - group_totals.group_sklad) > 0) OR
      (tool_nom.group_id = 0 AND (tool_nom.norma_green > 0) AND (tool_nom.norma_red > 0))
  )
  AND (
      CASE
          WHEN tool_nom.group_id <> 0 THEN tool_nom.norma - group_totals.group_sklad
          ELSE tool_nom.norma_green - tool_nom.sklad
      END
  ) > 0
  AND tool_nom.group_standard = 'true'
  AND tool_nom.norma_green IS NOT NULL;