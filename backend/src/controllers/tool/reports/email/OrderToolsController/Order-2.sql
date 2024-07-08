SELECT tool_nom.id AS id_tool,
       tool_nom.name,
       tool_nom.sklad,
       tool_nom.norma,
       tool_nom.group_id,
       tool_nom.group_standard
FROM dbo.tool_nom;