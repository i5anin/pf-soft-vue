WITH RECURSIVE
    TreePath AS (
        SELECT id, name, parent_id, name AS path
        FROM dbo.tool_tree
        WHERE parent_id = 1
        UNION ALL
        SELECT tt.id, tt.name, tt.parent_id, CONCAT(tp.path, ' / ', tt.name)
        FROM dbo.tool_tree tt
                 JOIN TreePath tp ON tt.parent_id = tp.id
    ),
    totals AS (
        SELECT group_id, SUM(sklad) AS group_total_sklad
        FROM dbo.tool_nom
        GROUP BY group_id
    ),
    damaged AS (
        SELECT tn.id               AS id_tool,
               tn.parent_id,
               tn.group_id,
               tn.group_standard,
               tn.name,
               tn.sklad,
               tn.norma,
               tn.norma_green,
               tn.norma_red,
               tn.status_color,
               tn.missing_percent,
               CASE
                   WHEN t.group_total_sklad > 0
                       THEN GREATEST(CASE WHEN tn.norma_green > 0 THEN tn.norma_green ELSE tn.norma END -
                                     t.group_total_sklad, 0)
                   ELSE GREATEST(CASE WHEN tn.norma_green > 0 THEN tn.norma_green ELSE tn.norma END - tn.sklad,
                                 0)
                   END             AS zakaz,
               t.group_total_sklad AS group_sklad,
               -- Измененная часть для mov_history:
               CASE
                   WHEN EXISTS(
                       SELECT 1
                       FROM dbo.vue_log vl
                                LEFT JOIN dbo.tool_history_nom thn
                                          ON vl.tool_id = thn.id_tool
                                              AND vl.datetime_log = thn."timestamp"
                                              AND vl.user_id = thn.issuer_id
                       WHERE vl.tool_id = tn.id
                         AND vl.new_amount <> vl.old_amount
                   ) THEN true
                   ELSE false END  AS mov_history
        FROM dbo.tool_nom tn
                 LEFT JOIN totals t ON tn.group_id = t.group_id
        WHERE CASE
                  WHEN t.group_total_sklad > 0
                      THEN
                      CASE WHEN tn.norma_green > 0 THEN tn.norma_green ELSE tn.norma END - t.group_total_sklad >
                      0
                  ELSE CASE WHEN tn.norma_green > 0 THEN tn.norma_green ELSE tn.norma END - tn.sklad > 0
                  END
        GROUP BY tn.id, tn.parent_id, tn.name, tn.sklad, tn.norma, tn.group_id,
                 tn.group_standard, t.group_total_sklad, tn.norma_green, tn.norma_red,
                 tn.status_color, tn.missing_percent
    ),
    folder_colors AS (
        SELECT d.parent_id,
               CASE
                   WHEN COUNT(CASE WHEN d.status_color = 'red' THEN 1 END) > 0 THEN 'red'
                   WHEN COUNT(CASE WHEN d.status_color = 'yellow' THEN 1 END) > 0 THEN 'yellow'
                   ELSE 'green'
                   END AS color_folder
        FROM damaged d
        GROUP BY d.parent_id
    ),
    -- Добавляем промежуточный CTE для сортировки
    sorted_damaged AS (
        SELECT d.*,
               ROW_NUMBER() OVER (PARTITION BY d.parent_id ORDER BY d.missing_percent DESC) as rn
        FROM damaged d
    )
SELECT sd.parent_id,
       tp.path,
       fc.color_folder,
       JSON_AGG(
               JSON_BUILD_OBJECT(
                       'id_tool', sd.id_tool,
                       'name', sd.name,
                       'sklad', sd.sklad,
                       'norma', sd.norma,
                       'norma_green', sd.norma_green,
                       'norma_red', sd.norma_red,
                       'zakaz', sd.zakaz,
                       'group_id', sd.group_id,
                       'group_standard', sd.group_standard,
                       'group_sklad', sd.group_sklad,
                       'mov_history', sd.mov_history,
                       'status_color', sd.status_color,
                       'missing_percent', sd.missing_percent
               )
               ORDER BY sd.rn -- Сортируем JSON_AGG по rn
       ) AS tools
FROM sorted_damaged sd -- Используем sorted_damaged вместо damaged
         JOIN TreePath tp ON sd.parent_id = tp.id
         JOIN folder_colors fc ON sd.parent_id = fc.parent_id
GROUP BY sd.parent_id, tp.path, fc.color_folder
HAVING SUM(sd.zakaz) > 0
ORDER BY CASE
             WHEN fc.color_folder = 'red' THEN 1
             WHEN fc.color_folder = 'yellow' THEN 2
             WHEN fc.color_folder = 'green' THEN 3
             ELSE 4 --  Этот пункт может быть не нужен, если вы уверены, что будут только 3 цвета.
             END,
         tp.path;