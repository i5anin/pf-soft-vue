SELECT
    DATE(datetime_log) AS date,
    SUM(old_amount - new_amount) AS total_kolvo
FROM dbo.vue_log
WHERE old_amount - new_amount > 0
GROUP BY DATE(datetime_log)
ORDER BY date;
