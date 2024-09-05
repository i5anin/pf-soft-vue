# Vuetify 3 software

```mermaid
graph LR
    client[Client] --> frontEnd[Frontend API Calls]

    frontEnd -->|getDatabaseInfo| loginController[Login Controller - getDatabaseInfo]
    frontEnd -->|getToolById| nomController[Nom Controller - getToolById]
    frontEnd -->|getTools| nomController[Nom Controller - getTools]
    frontEnd -->|addTool| nomController[Nom Controller - addTool]
    frontEnd -->|getToolParams| paramController[Param Controller - getToolParams]
    frontEnd -->|getToolsTree| treeController[Tree Controller - getToolsTree]
    frontEnd -->|findDetailProduction| issueController[Issue Controller - findDetailProduction]
    frontEnd -->|getToolHistoryId| historyController[History Controller - getToolHistoryId]
    frontEnd -->|getToolHistory| historyController[History Controller - getToolHistory]
    frontEnd -->|getDamaged| damagedController[Damaged Controller - getDamaged]
    frontEnd -->|updateToolInventory| skladController[Sklad Controller - updateToolInventory]
    frontEnd -->|genBuchWeek| reportBuchWeekController[Отчёт Бухгалтерию Week Controller - genBuchWeek]
    frontEnd -->|genBuchEndOp| reportBuchEndOpController[Отчёт Бухгалтерию End Op Controller - genBuchEndOp]
    frontEnd -->|genBuchMonth| reportBuchMonthController[Отчёт Бухгалтерию Month Controller - genBuchMonth]
    frontEnd -->|genZayavInstr| reportZakazController[Отчёт заказа Controller - genZayavInstr]

    frontEnd -->|updateToolParam| apiUpdate[API - updateToolParam]
    frontEnd -->|deleteToolParam| apiDelete[API - deleteToolParam]
    frontEnd -->|addToolParam| apiAdd[API - addToolParam]

    apiUpdate -->|PUT /tools-params/:id| paramController[Param Controller - updateToolParam]
    apiDelete -->|DELETE /tools-params/:id| paramController[Param Controller - deleteToolParam]
    apiAdd -->|POST /tools-params| paramController[Param Controller - addToolParam]

    loginController --> db[(Database)]
    nomController --> db
    paramController --> db
    treeController --> db
    issueController --> db
    historyController --> db
    damagedController --> db
    skladController --> db
    reportBuchWeekController --> db
    reportBuchEndOpController --> db
    reportBuchMonthController --> db
    reportZakazController --> db

```

## 1. **Настройка Пользовательских Приоритетов:**

- Установка приоритетов для каждого пользователя в зависимости от их роли (Хохлов/Синицын, Наладчик/Инструментальщик).

## 2. **Интерфейс для Хохлова/Синицына:**

- **Боковая панель:**
  - Список инструментов с возможностью добавления и редактирования.✅

| Дата       | Название    | Применяемость Материала | Радиус | Маркировка                     | Количество на Складе | Нормативный Запас на Неделю | Заказ |
| ---------- | ----------- | ----------------------- | ------ | ------------------------------ | -------------------- | --------------------------- | ----- |
| 07.11.2023 | Треугольная | Нержавейка              | 1.2    | WNMG080408-BF WS7225 HARDSTONE | 30                   | 30                          | 25    |
| 07.11.2023 | Треугольная | Сталь                   | 0.8    | WNMG080408-BF WS7225 HARDSTONE | 87                   | 30                          | 34    |
| 07.11.2023 | Треугольная | Нержавейка              | 0.4    | WNMG080408-BF WS7225 HARDSTONE | 58                   | 30                          | 45    |
| 07.11.2023 | Треугольная | Сталь                   | 0.4    | WNMG080408-BF WS7225 HARDSTONE | 45                   | 30                          | 17    |
| 07.11.2023 | Треугольная | Нержавейка              | 0.8    | WNMG080408-BF WS7225 HARDSTONE | 12                   | 30                          | 27    |

- Таблица расхода инструмента с возможностью выгрузки еженедельного отчета.✅

### Таблица расхода инструментов:

| Название    | Применяемость Материала | Радиус | Маркировка                     | Количество на Складе | Нормативный Запас на Неделю | Заказ |
| ----------- | ----------------------- | ------ | ------------------------------ | -------------------- | --------------------------- | ----- |
| Треугольная | Нержавейка              | 1.2    | WNMG080408-BF WS7225 HARDSTONE | 30                   | 30                          | 25    |
| Треугольная | Сталь                   | 0.8    | WNMG080408-BF WS7225 HARDSTONE | 87                   | 30                          | 34    |
| Треугольная | Нержавейка              | 0.4    | WNMG080408-BF WS7225 HARDSTONE | 58                   | 30                          | 45    |
| Треугольная | Сталь                   | 0.4    | WNMG080408-BF WS7225 HARDSTONE | 45                   | 30                          | 17    |
| Треугольная | Нержавейка              | 0.8    | WNMG080408-BF WS7225 HARDSTONE | 12                   | 30                          | 27    |

- **Таблица для учета инструмента:** Учет инструмента на конкретную деталь и операции.
- **План загрузки оборудования:** Отображение конкретных операций на детали, используемого инструмента и его количества.
- **Отчет по окончанию операции:** Используемый инструмент, количество использованного инструмента и количество изделий.
  Уведомление для наладчиков по окончанию операции с возможностью печати отчета.
- **Журнал испорченного инструмента:** Заполняется наладчиком или инструментальщиком, включает кто испортил, на каком
  станке, по какой причине.

## 3. **Интерфейс для Инструментальщика/Наладчика:**

- **Выбор оператора:** При выборе оператора выбирается смена для быстрого поиска оператора.

| Оператор -> | Смена -> | ФИО    |
| ----------- | -------- | ------ |
| Оператор    | 1 смена  | Иванов |
| Оператор    | 2 смена  | Петров |
| Оператор    | 3 смена  | ...    |

- **Выбор детали и операции:** Включает выбор детали из плана, выбор операции, название, выбор по применяемости (сталь,
  нерж, цветн.) и выбор по радиусу режущей кромки.

| Деталь ^ |
| -------- |
| Втулка   |
| Ось      |
| Гайка    |
| Опора    |
| ...      |

| Операция ^ |
| ---------- |
| 0050n      |
| 0100n      |
| 0150n, ... |
| ...        |
| ...        |

| Номера Операций | Материал | Радиус |
| --------------- | -------- | ------ |
| №1              | Сталь    | 0.4    |
| №2              | Нерж     | 0.8    |
| №3              | Цветная  | 0.8    |
| №4              | Цветная  | 1.2    |
| №4              | Цветная  | 0.8    |

- **Указ количества:** Включает критерии заполнения, такие как ограничение количества и отправка уведомления наладчику
  при перерасходе инструмента.
- **Журнал испорченного инструмента:** Аналогичный интерфейс для наладчиков с возможностью просмотра и редактирования
  данных по расходу и выдаче инструмента на конкретную деталь.
