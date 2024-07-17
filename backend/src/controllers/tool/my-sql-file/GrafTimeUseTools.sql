WITH hour_counts AS (
  SELECT
    EXTRACT(HOUR FROM datetime_log) AS hour_of_day,
    COUNT(*) AS issue_count
  FROM dbo.vue_log
  WHERE old_amount < new_amount -- Условие выдачи инструмента
  GROUP BY hour_of_day
)
SELECT
  hour_of_day,
  issue_count,
  (issue_count::numeric / SUM(issue_count) OVER ()) * 100 AS percentage
FROM hour_counts
ORDER BY hour_of_day;