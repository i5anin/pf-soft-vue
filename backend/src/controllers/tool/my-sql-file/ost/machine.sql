SELECT CASE
           WHEN id = 27 THEN id::VARCHAR || ':' || cnc_name
           ELSE id::VARCHAR  || ':' || cnc_name
           END AS Combined_Data
FROM (SELECT 27 AS id, 'Другое оборудование' AS cnc_name -- "Другое оборудование" first
      UNION ALL
      (SELECT id, cnc_name
       FROM dbo.cnc
       WHERE plan = TRUE
         AND active = TRUE
       ORDER BY CASE WHEN cnc_name = 'Другое оборудование' THEN 0 ELSE 1 END, id) -- Order other rows
     ) AS CombinedData;