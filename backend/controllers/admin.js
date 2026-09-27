import pool, { enTransaccion } from '../config/database.js';
import { liquidarPartido, anularPartido, LiquidacionError } from '../services/liquidacion.js';
import { crearPartido, PartidoError } from '../services/partidos.js';

// Los errores de validación se muestran tal cual; el resto se registra y se oculta.
const responderError = (res, error, mensaje) => {
  if (error instanceof LiquidacionError || error instanceof PartidoError) {
    return res.status(400).json({ error: error.message });
  }
  console.error(`${mensaje}:`, error);
  res.status(500).json({ error: mensaje });
};

const idDePartido = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new LiquidacionError('Id de partido inválido');
  return id;
};

// Todos los partidos con el resumen de sus apuestas.
// por_liquidar: ya empezó y sigue pendiente (se compara con la hora de la base de datos).
export const listarPartidos = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*,
        (p.estado = 'pendiente' AND p.fecha < NOW()) AS por_liquidar,
        COUNT(a.id)::int AS total_apuestas,
        COUNT(a.id) FILTER (WHERE a.estado = 'pendiente')::int AS apuestas_pendientes,
        COALESCE(SUM(a.monto) FILTER (WHERE a.estado = 'pendiente'), 0) AS monto_pendiente
      FROM partidos p
      LEFT JOIN apuestas a ON a.partido_id = p.id
      GROUP BY p.id
      ORDER BY p.fecha
    `);
    res.json(rows);
  } catch (error) {
    responderError(res, error, 'Error al cargar los partidos');
  }
};

export const nuevoPartido = async (req, res) => {
  try {
    const partido = await enTransaccion(client => crearPartido(client, req.body ?? {}));
    res.status(201).json(partido);
  } catch (error) {
    responderError(res, error, 'Error al crear el partido');
  }
};

export const liquidar = async (req, res) => {
  try {
    const partidoId = idDePartido(req);
    const { golesLocal, golesVisitante } = req.body ?? {};
    const resumen = await enTransaccion(client => liquidarPartido(client, partidoId, { golesLocal, golesVisitante }));
    res.json(resumen);
  } catch (error) {
    responderError(res, error, 'Error al liquidar el partido');
  }
};

export const anular = async (req, res) => {
  try {
    const partidoId = idDePartido(req);
    const resumen = await enTransaccion(client => anularPartido(client, partidoId));
    res.json(resumen);
  } catch (error) {
    responderError(res, error, 'Error al suspender el partido');
  }
};
