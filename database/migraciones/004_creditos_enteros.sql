-- Migración 004: los créditos (saldo, montos y ganancias) pasan a ser enteros
-- Se puede ejecutar más de una vez sin problemas. Todo ocurre en una transacción:
-- si algo falla, no cambia nada.
--
-- ANTES DE APLICAR, revisa qué filas tienen decimales (son las únicas que cambian):
--
--   SELECT 'usuarios' AS tabla, id, saldo AS valor FROM usuarios WHERE saldo <> TRUNC(saldo)
--   UNION ALL SELECT 'apuestas.monto', id, monto FROM apuestas WHERE monto <> TRUNC(monto)
--   UNION ALL SELECT 'apuestas.ganancia', id, ganancia FROM apuestas WHERE ganancia <> TRUNC(ganancia);
--
-- Los decimales se descartan (hacia cero): $992,50 queda en $992 y una ganancia
-- de $42,50 en $42, igual que la regla nueva de pagar redondeando hacia abajo.
-- La cuota (1.85, 3.20, 4.10) sigue con decimales: es un multiplicador, no un crédito.

BEGIN;

ALTER TABLE usuarios ALTER COLUMN saldo TYPE INTEGER USING TRUNC(saldo)::INTEGER;
ALTER TABLE usuarios ALTER COLUMN saldo SET DEFAULT 1000;
ALTER TABLE apuestas ALTER COLUMN monto TYPE INTEGER USING TRUNC(monto)::INTEGER;
ALTER TABLE apuestas ALTER COLUMN ganancia TYPE INTEGER USING TRUNC(ganancia)::INTEGER;

-- Última defensa en la base: el saldo nunca queda negativo y no hay apuestas de $0
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_saldo_no_negativo') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_saldo_no_negativo CHECK (saldo >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'apuestas_monto_positivo') THEN
    ALTER TABLE apuestas ADD CONSTRAINT apuestas_monto_positivo CHECK (monto > 0);
  END IF;
END $$;

COMMIT;
