WITH totals AS (SELECT group_id, SUM(sklad) AS group_total_sklad
                FROM dbo.tool_nom
                WHERE group_id IS NOT NULL
                  AND group_id <> 0
                GROUP BY group_id)
SELECT id,
       name,
       CASE
           WHEN tool_nom.group_id IS NULL
               OR tool_nom.group_id = 0
               THEN norma - sklad
           ELSE 0
           END AS zakaz,
       sklad,
       norma,
       tool_nom.group_id,
       group_standard

FROM dbo.tool_nom
         LEFT JOIN totals ON dbo.tool_nom.group_id = totals.group_id;