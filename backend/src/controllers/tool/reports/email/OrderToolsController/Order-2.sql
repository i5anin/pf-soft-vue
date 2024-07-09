SELECT tool_nom.id AS id_tool,
       tool_nom.name,
       tool_nom.sklad,
       tool_nom.norma,
       --группа
       tool_nom.group_id,
       tool_nom.group_standard,
       --3 нормы
       tool_nom.norma_green,
       tool_nom.norma_red
FROM dbo.tool_nom;