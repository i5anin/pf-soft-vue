SELECT group_id, SUM(sklad) AS group_total_sklad
FROM dbo.tool_nom
WHERE group_id IS NOT NULL
  AND group_id <> 0
GROUP BY group_id