SELECT datetime_log,
       new_amount - old_amount AS kolvo
FROM dbo.vue_log
WHERE tool_id = :tool_id
ORDER BY datetime_log;
