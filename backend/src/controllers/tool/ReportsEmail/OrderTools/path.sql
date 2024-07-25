-- Обновление столбца path_file в таблице "dbo.tool_nom"
UPDATE "dbo"."tool_nom" AS tool_nom_table
SET path_file = tree_path."path_file"
FROM (
    -- Рекурсивный CTE для построения пути в иерархии "dbo.tool_tree"
    WITH RECURSIVE TreePath AS (
        SELECT 
            id, 
            name, 
            parent_id, 
            name AS path_file -- Инициализация пути с текущим именем
        FROM 
            "dbo"."tool_tree"
        WHERE 
            parent_id = 1 -- Начинаем с корневого элемента (parent_id = 1)
        
        UNION ALL
        
        SELECT 
            tool_tree.id, 
            tool_tree.name, 
            tool_tree.parent_id, 
            CONCAT(tp.path_file, ' / ', tool_tree.name) AS path_file -- Добавляем текущее имя к пути
        FROM 
            "dbo"."tool_tree"
        JOIN 
            TreePath AS tp ON tool_tree.parent_id = tp.id -- Рекурсивное объединение с родительскими узлами
    )
    SELECT 
        id, 
        path_file
    FROM 
        TreePath
) AS tree_path
WHERE 
    tool_nom_table."parent_id" = tree_path.id -- Сопоставление по parent_id
    AND tool_nom_table."norma" <> 0; -- Условие для обновления (norma не равна 0)