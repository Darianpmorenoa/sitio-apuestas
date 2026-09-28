import pool from '../config/database.js';
import { esIdValido } from '../utils/validators.js';

const errorInterno = (res, error, mensaje) => {
  console.error(`${mensaje}:`, error);
  res.status(500).json({ error: mensaje });
};

export const getAllMatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM partidos
      WHERE fecha >= NOW()
      ORDER BY fecha ASC
    `);
    res.json(result.rows);
  } catch (error) {
    errorInterno(res, error, 'Error al cargar los partidos');
  }
};

export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esIdValido(id)) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    const result = await pool.query('SELECT * FROM partidos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    errorInterno(res, error, 'Error al cargar el partido');
  }
};

export const getMatchResults = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM partidos
      WHERE fecha < NOW()
      ORDER BY fecha DESC
    `);
    res.json(result.rows);
  } catch (error) {
    errorInterno(res, error, 'Error al cargar los resultados');
  }
};
