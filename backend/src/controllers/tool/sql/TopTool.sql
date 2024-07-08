SELECT thn.id_tool, tn.name, SUM(thn.quantity) AS total_issued
FROM dbo.tool_history_nom thn
JOIN dbo.tool_nom tn ON thn.id_tool = tn.id
GROUP BY thn.id_tool, tn.name
ORDER BY total_issued DESC;