-- Migración 001: datos necesarios para liquidar apuestas
-- Se puede ejecutar más de una vez sin problemas.

-- Cuota con la que se hizo cada apuesta (antes no se guardaba)
ALTER TABLE apuestas ADD COLUMN IF NOT EXISTS cuota DECIMAL(5, 2);

-- Momento en que la apuesta se marcó como ganada, perdida o anulada
ALTER TABLE apuestas ADD COLUMN IF NOT EXISTS fecha_liquidacion TIMESTAMP;

-- Las apuestas existentes se hicieron con las cuotas fijas del sitio
UPDATE apuestas
SET cuota = CASE prediccion WHEN '1' THEN 1.85 WHEN 'X' THEN 3.20 WHEN '2' THEN 4.10 END
WHERE cuota IS NULL;
