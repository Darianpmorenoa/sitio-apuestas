import pool, { enTransaccion } from '../config/database.js';
import { crearApuesta, ApuestaError } from '../services/apuestas.js';
import { esIdValido } from '../utils/validators.js';

// Toda la apuesta (validar, descontar saldo y registrarla) ocurre en una sola transacción
export const createBet = async (req, res) => {
  try {
    const { apuesta, saldo } = await enTransaccion(client => crearApuesta(client, req.user.id, req.body ?? {}));
    res.status(201).json({ message: 'Apuesta realizada exitosamente', bet: apuesta, saldo });
  } catch (error) {
    if (error instanceof ApuestaError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error al crear apuesta:', error);
    res.status(500).json({ error: 'Error al realizar la apuesta' });
  }
};

export const getUserBets = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const result = await pool.query(`
      SELECT a.*, p.equipo_local, p.equipo_visitante, p.resultado,
             p.fecha AS fecha_partido, p.goles_local, p.goles_visitante
      FROM apuestas a
      JOIN partidos p ON a.partido_id = p.id
      WHERE a.usuario_id = $1
      ORDER BY a.fecha_apuesta DESC
    `, [usuario_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener apuestas:', error);
    res.status(500).json({ error: 'Error al obtener las apuestas' });
  }
};

export const getBetById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    if (!esIdValido(id)) {
      return res.status(404).json({ error: 'Apuesta no encontrada' });
    }

    const result = await pool.query(
      'SELECT * FROM apuestas WHERE id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Apuesta no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener la apuesta:', error);
    res.status(500).json({ error: 'Error al obtener la apuesta' });
  }
};
