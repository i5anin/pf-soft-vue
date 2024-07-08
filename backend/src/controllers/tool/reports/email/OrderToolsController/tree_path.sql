-- Файл tree_path.sql
WITH RECURSIVE TreePath AS (SELECT tool_tree.id,
                                   CAST(tool_tree.name AS TEXT) AS path,
                                   tool_tree.parent_id
                            FROM dbo.tool_tree
                            WHERE tool_tree.parent_id = 1

                            UNION ALL

                            SELECT tt.id,
                                   CONCAT(tp.path, ' / ', tt.name) AS path,
                                   tt.parent_id
                            FROM dbo.tool_tree tt
                                     JOIN
                                 TreePath tp ON tt.parent_id = tp.id)
SELECT *
FROM TreePath;
