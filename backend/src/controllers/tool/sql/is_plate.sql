-- Обновляем таблицу tool_nom, чтобы установить is_plate в TRUE,
-- если путь в иерархии инструментов содержит "Пластины"
UPDATE dbo.tool_nom
SET is_plate = TRUE
WHERE parent_id IN (WITH
                        RECURSIVE TreePath
                                      AS (SELECT id, name, parent_id
                                          FROM dbo.tool_tree
                                          WHERE name LIKE '%Пластины%' -- Начинаем с узлов, содержащих "Пластины"

                                          UNION ALL

                                          SELECT tt.id, tt.name, tt.parent_id
                                          FROM dbo.tool_tree tt
                                                   JOIN TreePath tp ON tt.id = tp.parent_id -- Движемся вверх по иерархии
        )
                    SELECT id
                    FROM TreePath -- Выбираем все ID, входящие в пути с "Пластины"
);