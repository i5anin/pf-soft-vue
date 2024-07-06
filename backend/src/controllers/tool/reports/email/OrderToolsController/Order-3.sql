SELECT tool_nom.id                      AS id_tool,       -- Идентификатор инструмента
       tool_nom.name,                                     -- Название инструмента
       tool_nom.sklad,                                    -- Количество на складе
       tool_nom.norma,                                    -- Норма инструмента
       COALESCE(tool_nom.group_id, '0') AS group_display, -- Если group_id равен NULL, то использовать '0'
       tool_nom.group_standard,                           -- Стандарт группы
       CASE
           WHEN tool_nom.group_id IS NULL -- Когда group_id равно NULL
               OR tool_nom.group_id = 0 -- Или group_id равно 0
               THEN tool_nom.norma - tool_nom.sklad -- Вычисляется разница между нормой и количеством на складе
           ELSE 0 -- В остальных случаях значение равно 0
           END                          AS zakaz          -- Алиас для вычисляемого столбца
FROM dbo.tool_nom;
