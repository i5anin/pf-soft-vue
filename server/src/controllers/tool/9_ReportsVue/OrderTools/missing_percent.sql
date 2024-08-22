WITH GroupSklad AS (
    SELECT
        tn.id,
        (SELECT SUM(tn2.sklad) FROM dbo.tool_nom AS tn2 WHERE tn2.group_id = tn.group_id) AS group_sklad
    FROM
        dbo.tool_nom AS tn
)
UPDATE dbo.tool_nom AS tn
SET missing_percent =
        CASE
            WHEN tn.norma_green > 0 AND COALESCE(gs.group_sklad, tn.sklad) < tn.norma_green
                THEN ROUND(((tn.norma_green - COALESCE(gs.group_sklad, tn.sklad))::numeric / tn.norma_green) * 100, 0)
            WHEN tn.norma_red > 0 AND COALESCE(gs.group_sklad, tn.sklad) < tn.norma_red
                THEN ROUND(((tn.norma_red - COALESCE(gs.group_sklad, tn.sklad))::numeric / tn.norma_red) * 100, 0)
            WHEN tn.norma > 0 AND COALESCE(gs.group_sklad, tn.sklad) < tn.norma
                THEN ROUND(((tn.norma - COALESCE(gs.group_sklad, tn.sklad))::numeric / tn.norma) * 100, 0)
            ELSE NULL
            END
FROM GroupSklad AS gs
WHERE tn.id = gs.id;