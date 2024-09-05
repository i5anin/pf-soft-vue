SELECT
    tool_history_nom.id AS tool_history_nom_id,
    specs_nom_operations.id AS specs_nom_operations_id,
    specs_nom.ID AS specs_nom_id,
    specs_nom.NAME AS specs_nom_name,
    specs_nom.description AS specs_nom_description,
    oon.no AS operations_ordersnom_no,
    dbo.get_full_cnc_type(dbo.get_op_type_code(specs_nom_operations.ID)) AS operation_type,
    tool_history_nom.quantity AS tool_history_nom_quantity,
    CASE
        WHEN tool_history_nom.id_user < 0 THEN (SELECT name FROM dbo.tool_user_custom_list WHERE -id = tool_history_nom.id_user)
        ELSE o.fio
    END AS user_fio,
    tool_history_nom.id_user AS tool_history_nom_user_id,
    tool_history_nom.timestamp AS tool_history_nom_timestamp,
    tn.name AS tool_nom_name,
    tool_history_nom.id_tool AS tool_history_nom_tool_id,
    tool_history_nom.type_issue AS tool_history_nom_type_issue,
    tool_history_nom.comment AS tool_history_nom_comment,
    tool_history_nom.cancelled AS tool_history_nom_cancelled,
    tool_history_nom.issuer_id AS tool_history_nom_issuer_id,
    vu.login AS issuer_fio,
    vu2.login AS canceller_login,
    specs_nom_operations.status_ready AS operation_ready,
    tn.sklad AS current_stock
FROM dbo.tool_history_nom
LEFT JOIN dbo.specs_nom_operations ON tool_history_nom.specs_op_id = specs_nom_operations.id
LEFT JOIN dbo.specs_nom ON specs_nom_operations.specs_nom_id = specs_nom.id
LEFT JOIN dbo.operations_ordersnom oon ON oon.op_id = specs_nom_operations.ordersnom_op_id
LEFT JOIN dbo.operators o ON tool_history_nom.id_user = o.id
LEFT JOIN dbo.tool_nom tn ON tool_history_nom.id_tool = tn.id
LEFT JOIN dbo.vue_users vu ON tool_history_nom.issuer_id = vu.id
LEFT JOIN dbo.vue_users vu2 ON tool_history_nom.cancelled_id = vu2.id
WHERE tool_history_nom.specs_op_id =  $1
ORDER BY tool_history_nom.timestamp DESC;