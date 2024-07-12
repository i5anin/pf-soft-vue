-- Обновляем таблицу tool_nom, чтобы установить is_plate в TRUE,
-- если путь в иерархии инструментов содержит "Пластины"
WITH RECURSIVE TreePath AS (SELECT id, name, parent_id
                            FROM dbo.tool_tree
                            WHERE name LIKE '%Пластины%' -- Начинаем с узлов, содержащих "Пластины"

                            UNION ALL

                            SELECT tt.id, tt.name, tt.parent_id
                            FROM dbo.tool_tree tt
                                     JOIN TreePath tp ON tt.parent_id = tp.id -- Движемся вниз по иерархии
)
UPDATE dbo.tool_nom
SET is_plate = TRUE
WHERE parent_id IN (SELECT id FROM TreePath);
