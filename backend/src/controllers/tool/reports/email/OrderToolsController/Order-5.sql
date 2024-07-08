-- Файл main_query.sql
WITH totals AS (
    SELECT tool_nom.group_id,
           SUM(tool_nom.sklad) AS group_total_sklad
    FROM dbo.tool_nom
    WHERE tool_nom.group_id IS NOT NULL
      AND tool_nom.group_id <> 0
    GROUP BY tool_nom.group_id
)
SELECT tool_nom.id                      AS id_tool,
       tool_nom.name,
       tool_nom.sklad,
       tool_nom.norma,
       (
           WITH RECURSIVE TreePath AS (
               SELECT tool_tree.id,
                      CAST(tool_tree.name AS TEXT) AS path,
                      tool_tree.parent_id
               FROM dbo.tool_tree
               WHERE tool_tree.parent_id = 1

               UNION ALL

               SELECT tt.id,
                      CONCAT(tp.path, ' / ', tt.name) AS path,
                      tt.parent_id
               FROM dbo.tool_tree tt
               JOIN TreePath tp ON tt.parent_id = tp.id
           )
           SELECT path
           FROM TreePath
       ) AS tool_path,
       COALESCE(tool_nom.group_id, '0') AS group_display,
       tool_nom.group_standard,
       CASE
           WHEN tool_nom.group_id IS NULL OR tool_nom.group_id = 0 THEN tool_nom.norma - tool_nom.sklad
           ELSE 0
       END                          AS zakaz
FROM dbo.tool_nom
LEFT JOIN totals ON tool_nom.group_id = totals.group_id;