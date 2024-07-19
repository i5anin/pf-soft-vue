SELECT JSON_EXTRACT(configuration, '$.choices') AS choices_data
FROM osticket_db.ost_form_field
WHERE name = 'machine';