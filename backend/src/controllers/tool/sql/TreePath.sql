WITH RECURSIVE
    TreePath AS ( -- Начало рекурсивного запроса для построения пути в дереве
        SELECT id,
               name,
               parent_id,
               name AS path -- Начальный путь это просто имя текущей записи
        FROM dbo.tool_tree
        WHERE parent_id = 1 -- Стартуем с корня иерархии

        UNION ALL

        SELECT tool_tree.id,
               tool_tree.name,
               tool_tree.parent_id,
               CONCAT(TreePath.path, ' / ', tool_tree.name) -- Строим путь, добавляя имя текущей записи
        FROM dbo.tool_tree
                 JOIN TreePath ON tool_tree.parent_id = TreePath.id -- Присоединяем дочерние элементы к родительским
    ),
    ToolDetails AS ( -- Выборка информации об инструментах
        SELECT tool_nom.id AS id_tool, -- Используем уникальный ID из tool_nom
               tool_nom.name,
               tool_nom.parent_id,
               tool_nom.sklad,         -- Добавляем склад
               tool_nom.norma          -- Добавляем норму
        FROM dbo.tool_nom
        GROUP BY tool_nom.id,    -- Группировка по уникальному ID из tool_nom
                 tool_nom.name,
                 tool_nom.parent_id,
                 tool_nom.sklad, -- Группировка по складу
                 tool_nom.norma -- Группировка по норме
    )
SELECT ToolDetails.id_tool, -- ID инструмента
       ToolDetails.name,    -- Название инструмента
       TreePath.path,       -- Путь в дереве
       ToolDetails.sklad,   -- Склад
       ToolDetails.norma    -- Норма
FROM ToolDetails
         JOIN TreePath ON ToolDetails.parent_id = TreePath.id
WHERE ToolDetails.id_tool = :id_tool; -- Фильтруем результаты по уникальному ID инструмента
