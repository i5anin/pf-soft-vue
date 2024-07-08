SELECT dbo.tool_history_nom.id_tool,                                              -- Код инструмента
       dbo.tool_nom.name,                                                         -- Название инструмента
       SUM(dbo.tool_history_nom.quantity)               AS total_issued_per_tool, -- Количество выданного инструмента (по каждому типу)
       (SELECT SUM(quantity) FROM dbo.tool_history_nom) AS total_issued_overall   -- Общее количество выданных инструментов (всех типов)
FROM dbo.tool_history_nom
         JOIN dbo.tool_nom ON dbo.tool_history_nom.id_tool = dbo.tool_nom.id
GROUP BY dbo.tool_history_nom.id_tool, dbo.tool_nom.name
ORDER BY total_issued_per_tool DESC;