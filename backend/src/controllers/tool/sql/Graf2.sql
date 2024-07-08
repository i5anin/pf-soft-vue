SELECT
    DATE(datetime_log) AS date,
    SUM(new_amount - old_amount) AS total_kolvo
FROM dbo.vue_log
GROUP BY DATE(datetime_log)
ORDER BY date;
