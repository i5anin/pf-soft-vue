SELECT tool_nom.id                      AS id_tool,
       tool_nom.name,
       CASE
           WHEN tool_nom.group_id IS NULL -- Когда group_id равно NULL
               OR tool_nom.group_id = 0 -- Или group_id равно 0
               THEN tool_nom.norma - tool_nom.sklad -- Вычисляется разница между нормой и количеством на складе
           ELSE 0 -- В остальных случаях значение равно 0
           END                          AS zakaz,         -- Алиас для вычисляемого столбца (добавлено вычисление)
       tool_nom.sklad,
       tool_nom.norma,
       tool_nom.group_id,
       tool_nom.group_standard

FROM dbo.tool_nom;