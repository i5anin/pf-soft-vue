SELECT
    payment.date AS payment_date,  -- Выбираем поле date как payment_date
    payment.payment AS payment_amount -- Выбираем поле payment как payment_amount
FROM
    payments payment -- Используем полное имя таблицы
WHERE
    payment.date >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')  -- Фильтруем по дате, начиная с 1-го числа текущего месяца
    AND payment.user_id = 409541442 -- Фильтруем по ID пользователя
ORDER BY
    payment_date; -- Сортируем результаты по дате