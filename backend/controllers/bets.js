import pool from '../config/database.js';
import { cuotaDe } from '../utils/cuotas.js';

export const createBet = async (req, res) => {
  try {
    const { partido_id, monto, prediccion } = req.body;
    const usuario_id = req.user.id;

    console.log('📝 Creando apuesta:', { partido_id, monto, prediccion, usuario_id });

    if (!partido_id || !monto || !prediccion) {
      return res.status(400).json({ error: 'Partido, monto y predicción son requeridos' });
    }

    if (!['1', 'X', '2'].includes(prediccion)) {
      return res.status(400).json({ error: 'Predicción inválida' });
    }

    const userResult = await pool.query('SELECT saldo FROM usuarios WHERE id = $1', [usuario_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userSaldo = userResult.rows[0].saldo;

    if (monto <= 0 || monto > userSaldo) {
      return res.status(400).json({ error: 'Monto inválido o saldo insuficiente' });
    }

    const matchResult = await pool.query('SELECT id, fecha, estado FROM partidos WHERE id = $1', [partido_id]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    if (matchResult.rows[0].estado !== 'pendiente') {
      return res.status(400).json({ error: 'Este partido ya no acepta apuestas' });
    }

    const matchDate = new Date(matchResult.rows[0].fecha);
    if (matchDate < new Date()) {
      return res.status(400).json({ error: 'No se puede apostar en partidos que ya han comenzado' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const saldoResult = await client.query(
        'UPDATE usuarios SET saldo = saldo - $1 WHERE id = $2 AND saldo >= $1 RETURNING saldo',
        [monto, usuario_id]
      );
      if (saldoResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Saldo insuficiente' });
      }
      const result = await client.query(
        'INSERT INTO apuestas (usuario_id, partido_id, monto, prediccion, cuota, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [usuario_id, partido_id, monto, prediccion, cuotaDe(prediccion), 'pendiente']
      );
      await client.query('COMMIT');

      res.status(201).json({
        message: 'Apuesta realizada exitosamente',
        bet: result.rows[0],
        saldo: parseFloat(saldoResult.rows[0].saldo)
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error al crear apuesta:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error al realizar la apuesta' });
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
    res.status(500).json({ error: error.message });
  }
};

export const getBetById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    const result = await pool.query(
      'SELECT * FROM apuestas WHERE id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Apuesta no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
