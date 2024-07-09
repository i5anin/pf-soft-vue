SELECT
    DATE(datetime_log) AS date,
    SUM(new_amount - old_amount ) AS total_kolvo
FROM dbo.vue_log
WHERE new_amount - old_amount  > 0
GROUP BY DATE(datetime_log)
ORDER BY date;
