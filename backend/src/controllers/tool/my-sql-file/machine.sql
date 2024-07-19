SELECT 999, 'Другое оборудование'

UNION ALL  -- Use UNION ALL to avoid duplicate removal if '999' exists in your table

(SELECT id, cnc_name
 FROM dbo.cnc
 WHERE plan = TRUE
   AND active = TRUE
 ORDER BY id)  -- Maintain order within the table data