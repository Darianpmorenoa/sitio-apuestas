// Liquida (o anula) las apuestas de un partido desde la terminal.
//
//   npm run liquidar                      → lista los partidos jugados que faltan por liquidar
//   npm run liquidar -- <id> <gl> <gv>    → registra el marcador y liquida las apuestas
//   npm run liquidar -- <id> --anular     → suspende el partido y devuelve lo apostado
//
// Necesita el archivo backend/.env con la conexión a la base de datos.

import pool from '../config/database.js';
import { liquidarPartido, anularPartido, LiquidacionError } from '../services/liquidacion.js';

const [idArg, ...resto] = process.argv.slice(2);

const listarPendientes = async () => {
  const { rows } = await pool.query(`
    SELECT p.id, p.equipo_local, p.equipo_visitante, p.fecha,
      (SELECT COUNT(*) FROM apuestas a WHERE a.partido_id = p.id AND a.estado = 'pendiente')::int AS apuestas
    FROM partidos p
    WHERE p.estado = 'pendiente' AND p.fecha < NOW()
    ORDER BY p.fecha
  `);

  if (rows.length === 0) {
    console.log('No hay partidos jugados pendientes de liquidar.');
    return;
  }

  console.log('Partidos jugados pendientes de liquidar:\n');
  rows.forEach(p => {
    console.log(`  [${p.id}] ${p.equipo_local} vs ${p.equipo_visitante} · ${new Date(p.fecha).toLocaleString('es-CL')} · ${p.apuestas} apuestas`);
  });
  console.log('\nPara liquidar:  npm run liquidar -- <id> <goles local> <goles visita>');
  console.log('Para anular:    npm run liquidar -- <id> --anular');
};

const ejecutar = async (accion) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resumen = await accion(client);
    await client.query('COMMIT');
    return resumen;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const main = async () => {
  if (!idArg) return listarPendientes();

  const partidoId = Number(idArg);
  if (!Number.isInteger(partidoId)) throw new LiquidacionError(`"${idArg}" no es un id de partido válido`);

  if (resto[0] === '--anular') {
    const r = await ejecutar(client => anularPartido(client, partidoId));
    console.log(`Partido suspendido: ${r.partido}`);
    console.log(`Apuestas anuladas: ${r.anuladas} · devuelto: $${r.devuelto}`);
    return;
  }

  if (resto.length !== 2) {
    throw new LiquidacionError('Uso: npm run liquidar -- <id> <goles local> <goles visita>');
  }

  const [golesLocal, golesVisitante] = resto;
  const r = await ejecutar(client => liquidarPartido(client, partidoId, { golesLocal, golesVisitante }));
  console.log(`Partido finalizado: ${r.partido} (resultado ${r.resultado})`);
  console.log(`Apuestas ganadas: ${r.ganadas} · perdidas: ${r.perdidas} · pagado: $${r.pagado}`);
};

main()
  .catch(error => {
    console.error(error instanceof LiquidacionError ? `Error: ${error.message}` : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
