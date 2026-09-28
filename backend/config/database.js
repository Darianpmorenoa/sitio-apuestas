import pkg from 'pg';
import dotenv from 'dotenv';

// ENV_FILE permite usar otra configuración (por ejemplo .env.test para la base de pruebas local)
dotenv.config({ path: process.env.ENV_FILE || '.env' });

const { Pool, types, defaults } = pkg;

// Las columnas TIMESTAMP (sin zona horaria) guardan la hora en UTC, igual que NOW() en Supabase.
// Sin esto, pg las leería y escribiría con la hora local del servidor (Chile) y quedarían corridas.
types.setTypeParser(types.builtins.TIMESTAMP, (valor) => new Date(`${valor.replace(' ', 'T')}Z`));
defaults.parseInputDatesAsUTC = true;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false },
});

// Ejecuta `accion(client)` dentro de una transacción: COMMIT si termina bien, ROLLBACK si falla.
export const enTransaccion = async (accion) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await accion(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
