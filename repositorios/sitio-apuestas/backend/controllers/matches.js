import pool from '../config/database.js';

export const getAllMatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM partidos
      WHERE fecha >= NOW()
      ORDER BY fecha ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM partidos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};
