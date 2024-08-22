-- Обновляем status_color с учетом складской информации всей группы
WITH GroupSklad AS (
    SELECT
        tn.id,  -- Добавляем id для корректного обновления
        (SELECT SUM(tn2.sklad) FROM  dbo.tool_nom AS tn2 WHERE tn2.group_id = tn.group_id) AS group_sklad
    FROM
        dbo.tool_nom AS tn
)
UPDATE dbo.tool_nom AS tn
SET status_color =
        CASE
            WHEN tn.norma_green > 0 AND COALESCE(gs.group_sklad, tn.sklad) <= tn.norma_red THEN 'red'
            WHEN (tn.norma_green > 0 AND COALESCE(gs.group_sklad, tn.sklad) > tn.norma_red AND COALESCE(gs.group_sklad, tn.sklad) <= tn.norma)
                OR (tn.norma_red > 0 AND COALESCE(gs.group_sklad, tn.sklad) <= tn.norma)  THEN 'yellow'
            WHEN tn.norma_green > 0 AND COALESCE(gs.group_sklad, tn.sklad) > tn.norma THEN 'green'
            WHEN tn.norma > 0 THEN
                CASE
                    WHEN (COALESCE(gs.group_sklad, tn.sklad)::numeric / tn.norma) * 100 <= 40 THEN 'red'
                    WHEN (COALESCE(gs.group_sklad, tn.sklad)::numeric / tn.norma) * 100 < 80 THEN 'yellow'
                    ELSE 'green'
                    END
            ELSE NULL
            END
FROM GroupSklad AS gs
WHERE tn.id = gs.id;