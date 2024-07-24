SELECT
  specs_nom.ID AS id_part,
  specs_nom.NAME AS specs_nom_name,
  specs_nom.description AS specs_nom_description,
  operations_ordersnom.no AS no_oper,
  specs_nom_operations.status_ready AS operation_ready,
  specs_nom_operations.id AS specs_op_id,
  tool_history_nom.id AS tool_history_id,
  COALESCE(tool_part_archive.archive, FALSE) AS is_archive
FROM dbo.specs_nom
LEFT JOIN dbo.specs_nom_operations ON specs_nom.id = specs_nom_operations.specs_nom_id
LEFT JOIN dbo.operations_ordersnom ON specs_nom_operations.ordersnom_op_id = operations_ordersnom.op_id
LEFT JOIN dbo.tool_history_nom ON specs_nom_operations.id = tool_history_nom.specs_op_id AND tool_history_nom.timestamp >= $2::date AND tool_history_nom.timestamp < $2::date + interval '1 day'
LEFT JOIN dbo.tool_part_archive ON specs_nom.id = tool_part_archive.specs_nom_id
WHERE specs_nom.ID = $1 AND (T OR tf OR f OR f4 OR fg OR dmc OR hision)
ORDER BY operations_ordersnom.no;