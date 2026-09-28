-- Migración 003: equipos de la Liga de Primera 2026 que faltaban
-- Se puede ejecutar más de una vez sin problemas (solo agrega los que no existen).
INSERT INTO equipos (nombre, liga)
SELECT nombre, 'Primera División'
FROM (VALUES
  ('Universidad de Concepción'),
  ('Huachipato'),
  ('Cobresal'),
  ('Coquimbo Unido'),
  ('Deportes La Serena'),
  ('Deportes Concepción'),
  ('Deportes Limache'),
  ('Palestino')
) AS nuevos(nombre)
WHERE NOT EXISTS (SELECT 1 FROM equipos e WHERE e.nombre = nuevos.nombre);
