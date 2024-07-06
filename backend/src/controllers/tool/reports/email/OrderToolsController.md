Хорошо, давайте разберем ваш SQL-запрос по шагам, начиная с простого варианта и постепенно усложняя его, чтобы получить итоговый результат.

**1. Базовый запрос:**

```sql
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    tn.group_id
FROM dbo.tool_nom tn;
```

Этот запрос просто выбирает все столбцы из таблицы `dbo.tool_nom`.  Это  базовая  точка  отсчета.

**2. Добавление столбца `group_display`:**

```sql
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    COALESCE(tn.group_id, '0') AS group_display
FROM dbo.tool_nom tn;
```

Здесь мы добавили столбец `group_display`,  который  отображает  `group_id`  или  "0",  если  `group_id`  равен  `NULL`.  Это  позволяет  удобно  отобразить  данные  в  таблице.

**3. Добавление `group_standard`:**

```sql
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard
FROM dbo.tool_nom tn;
```

В этот запрос мы добавили столбец `group_standard`.

**4. Расчет  `zakaz`  для  инструментов  без  групп:**

```sql
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    CASE
        WHEN tn.group_id IS NULL OR tn.group_id = 0 THEN tn.norma - tn.sklad
        ELSE 0
    END AS zakaz
FROM dbo.tool_nom tn;
```

Мы добавили  `zakaz`,  который  рассчитывается  как  разница  между  `norma`  и  `sklad`,  только  для  инструментов  без  групп.

**5. Создание  `totals`  CTE  (Common Table Expression):**

```sql
WITH totals AS (
    SELECT group_id, SUM(sklad) AS group_total_sklad
    FROM dbo.tool_nom
    WHERE group_id IS NOT NULL AND group_id <> 0
    GROUP BY group_id
)
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    CASE
        WHEN tn.group_id IS NULL OR tn.group_id = 0 THEN tn.norma - tn.sklad
        ELSE 0
    END AS zakaz
FROM dbo.tool_nom tn
LEFT JOIN totals t ON tn.group_id = t.group_id;
```

Здесь мы создаем `totals` CTE,  чтобы  подсчитать  суммарное  количество  `sklad`  для  каждой  группы.

**6. Добавление  `tool_path`  с  использованием  рекурсивного  CTE:**

```sql
WITH RECURSIVE
    TreePath AS (
        SELECT id, CAST(name AS TEXT) AS path, parent_id
        FROM dbo.tool_tree
        WHERE parent_id = 1
        UNION ALL
        SELECT tt.id, CONCAT(tp.path, ' / ', tt.name) AS path, tt.parent_id
        FROM dbo.tool_tree tt
                 JOIN TreePath tp ON tt.parent_id = tp.id
    ),
    totals AS (
        SELECT group_id, SUM(sklad) AS group_total_sklad
        FROM dbo.tool_nom
        WHERE group_id IS NOT NULL AND group_id <> 0
        GROUP BY group_id
    )
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    tp.path AS tool_path,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    CASE
        WHEN tn.group_id IS NULL OR tn.group_id = 0 THEN tn.norma - tn.sklad
        ELSE 0
    END AS zakaz
FROM dbo.tool_nom tn
LEFT JOIN totals t ON tn.group_id = t.group_id
LEFT JOIN TreePath tp ON tn.parent_id = tp.id;
```

Добавили  `tool_path`  с  использованием  рекурсивного  CTE  `TreePath`,  который  строит  путь  к  инструменту  в  дереве.

**7. Расчет  `zakaz`  для  инструментов  в  группах:**

```sql
WITH RECURSIVE
    TreePath AS (
        SELECT id, CAST(name AS TEXT) AS path, parent_id
        FROM dbo.tool_tree
        WHERE parent_id = 1
        UNION ALL
        SELECT tt.id, CONCAT(tp.path, ' / ', tt.name) AS path, tt.parent_id
        FROM dbo.tool_tree tt
                 JOIN TreePath tp ON tt.parent_id = tp.id
    ),
    totals AS (
        SELECT group_id, SUM(sklad) AS group_total_sklad
        FROM dbo.tool_nom
        WHERE group_id IS NOT NULL AND group_id <> 0
        GROUP BY group_id
    )
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    tp.path AS tool_path,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    t.group_total_sklad AS group_sum,
    CASE
        WHEN tn.group_id IS NOT NULL AND tn.group_id <> 0 THEN tn.norma - t.group_total_sklad
        ELSE tn.norma - tn.sklad
    END AS zakaz
FROM dbo.tool_nom tn
LEFT JOIN totals t ON tn.group_id = t.group_id
LEFT JOIN TreePath tp ON tn.parent_id = tp.id;
```

В  этом  шаге  мы  изменили  расчет  `zakaz`  для  инструментов  в  группах,  вычитая  `group_total_sklad`  из  `norma`.

**8. Фильтрация  данных:**

```sql
WITH RECURSIVE
    TreePath AS (
        SELECT id, CAST(name AS TEXT) AS path, parent_id
        FROM dbo.tool_tree
        WHERE parent_id = 1
        UNION ALL
        SELECT tt.id, CONCAT(tp.path, ' / ', tt.name) AS path, tt.parent_id
        FROM dbo.tool_tree tt
                 JOIN TreePath tp ON tt.parent_id = tp.id
    ),
    totals AS (
        SELECT group_id, SUM(sklad) AS group_total_sklad
        FROM dbo.tool_nom
        WHERE group_id IS NOT NULL AND group_id <> 0
        GROUP BY group_id
    )
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    tp.path AS tool_path,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    t.group_total_sklad AS group_sum,
    CASE
        WHEN tn.group_id IS NOT NULL AND tn.group_id <> 0 THEN tn.norma - t.group_total_sklad
        ELSE tn.norma - tn.sklad
    END AS zakaz
FROM dbo.tool_nom tn
LEFT JOIN totals t ON tn.group_id = t.group_id
LEFT JOIN TreePath tp ON tn.parent_id = tp.id
WHERE (
    tn.group_id = 0
    OR tn.group_id IS NULL
    OR tn.group_standard IS TRUE
);
```

В  этом  шаге  мы  добавили  условие  `WHERE`,  чтобы  отфильтровать  данные  и  отобразить  только  инструменты  из  корневой  группы  или  с  флагом  `group_standard`  равным  `TRUE`.

**9. Дополнительная  фильтрация:**

```sql
WITH RECURSIVE
    TreePath AS (
        SELECT id, CAST(name AS TEXT) AS path, parent_id
        FROM dbo.tool_tree
        WHERE parent_id = 1
        UNION ALL
        SELECT tt.id, CONCAT(tp.path, ' / ', tt.name) AS path, tt.parent_id
        FROM dbo.tool_tree tt
                 JOIN TreePath tp ON tt.parent_id = tp.id
    ),
    totals AS (
        SELECT group_id, SUM(sklad) AS group_total_sklad
        FROM dbo.tool_nom
        WHERE group_id IS NOT NULL AND group_id <> 0
        GROUP BY group_id
    )
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    tp.path AS tool_path,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    t.group_total_sklad AS group_sum,
    CASE
        WHEN tn.group_id IS NOT NULL AND tn.group_id <> 0 THEN tn.norma - t.group_total_sklad
        ELSE tn.norma - tn.sklad
    END AS zakaz
FROM dbo.tool_nom tn
LEFT JOIN totals t ON tn.group_id = t.group_id
LEFT JOIN TreePath tp ON tn.parent_id = tp.id
WHERE (
    tn.group_id = 0
    OR tn.group_id IS NULL
    OR tn.group_standard IS TRUE
) AND (
    (tn.group_id IS NOT NULL AND tn.group_id <> 0 AND (tn.norma - t.group_total_sklad) > 0) OR
    ((tn.norma - tn.sklad) > 0)
);
```

Мы  добавили  дополнительное  условие  в  `WHERE`,  чтобы  отфильтровать  данные  и  отобразить  только  инструменты,  для  которых  `zakaz`  больше  0.

**10. Итоговый  запрос:**

```sql
WITH RECURSIVE
    TreePath AS (
        SELECT id, CAST(name AS TEXT) AS path, parent_id
        FROM dbo.tool_tree
        WHERE parent_id = 1
        UNION ALL
        SELECT tt.id, CONCAT(tp.path, ' / ', tt.name) AS path, tt.parent_id
        FROM dbo.tool_tree tt
                 JOIN TreePath tp ON tt.parent_id = tp.id
    ),
    totals AS (
        SELECT group_id, SUM(sklad) AS group_total_sklad
        FROM dbo.tool_nom
        WHERE group_id IS NOT NULL AND group_id <> 0
        GROUP BY group_id
    )
SELECT
    tn.id AS id_tool,
    tn.name,
    tn.sklad,
    tn.norma,
    tp.path AS tool_path,
    COALESCE(tn.group_id, '0') AS group_display,
    tn.group_standard,
    t.group_total_sklad AS group_sum,
    tn.norma_red,
    tn.norma_green,
    CASE
        WHEN tn.group_id IS NOT NULL AND tn.group_id <> 0 THEN
            tn.norma - t.group_total_sklad
        ELSE
            tn.norma - tn.sklad
        END AS zakaz
FROM dbo.tool_nom tn
LEFT JOIN totals t ON tn.group_id = t.group_id
LEFT JOIN TreePath tp ON tn.parent_id = tp.id
WHERE (
    tn.group_id = 0
    OR tn.group_id IS NULL
    OR tn.group_standard IS TRUE
) AND (
    (tn.group_id IS NOT NULL AND tn.group_id <> 0 AND (tn.norma - t.group_total_sklad) > 0) OR
    (tn.norma_green IS NOT NULL AND tn.norma_red IS NOT NULL AND (tn.norma_green - tn.sklad) > 0 AND tn.sklad < tn.norma) OR
    ((tn.norma - tn.sklad) > 0)
)
ORDER BY tp.path, tn.name;
```

В  этом  конечном  запросе  мы  добав

