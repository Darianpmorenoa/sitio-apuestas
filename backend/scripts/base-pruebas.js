// Base de datos de pruebas LOCAL. Nunca toca la base de producción.
//
//   npm run pruebas:crear       → crea el usuario y la base "apuestas_test" en tu PostgreSQL local
//                                 (pide la contraseña del usuario postgres, solo esta vez)
//                                 y la llena con datos de prueba
//   npm run pruebas:reiniciar   → borra todo y vuelve a cargar los datos de prueba
//
// La conexión queda en backend/.env.test, que se crea solo y no se sube a git.
// Las cuentas de prueba usan la contraseña CLAVE_PRUEBAS de ese archivo.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pagoDe, cuotaDe } from '../utils/cuotas.js';
import { preguntarOculto } from '../utils/terminal.js';

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const archivoEnv = path.join(raiz, '.env.test');
const sqlDe = (nombre) => readFileSync(path.join(raiz, '..', 'database', nombre), 'utf8');

const HOSTS_LOCALES = ['localhost', '127.0.0.1', '::1'];

const aleatorio = (bytes) => randomBytes(bytes).toString('hex');

// Crea .env.test con contraseñas nuevas si todavía no existe
const prepararEnv = () => {
  if (existsSync(archivoEnv)) return;
  writeFileSync(archivoEnv, [
    '# Base de datos de pruebas LOCAL (npm run pruebas:crear). No se sube a git.',
    'ENV_FILE=.env.test',
    'NODE_ENV=test',
    'PORT=5001',
    'DB_HOST=localhost',
    'DB_PORT=5432',
    'DB_NAME=apuestas_test',
    'DB_USER=apuestas_test',
    `DB_PASSWORD=${aleatorio(16)}`,
    `JWT_SECRET=${aleatorio(32)}`,
    '# Contraseña de las cuentas de prueba (admin, juan y maria @pruebas.local)',
    `CLAVE_PRUEBAS=Prueba${aleatorio(4)}1`,
    ''
  ].join('\n'));
  console.log('Se creó backend/.env.test con contraseñas nuevas.');
};

// Lee .env.test y se niega a seguir si no apunta a una base local de pruebas
const leerConfig = () => {
  const env = dotenv.parse(readFileSync(archivoEnv));
  if (!HOSTS_LOCALES.includes(env.DB_HOST)) {
    throw new Error(`.env.test apunta a "${env.DB_HOST}". La base de pruebas debe ser local (localhost).`);
  }
  if (!/_(test|pruebas)$/.test(env.DB_NAME ?? '') || !/_(test|pruebas)$/.test(env.DB_USER ?? '')) {
    throw new Error('El nombre de la base y del usuario de pruebas deben terminar en "_test" o "_pruebas".');
  }
  return env;
};

// Crea (o actualiza) el usuario y la base de pruebas usando el superusuario postgres
const crearBase = async (env) => {
  const claveAdmin = process.env.PGPASSWORD ?? await preguntarOculto('Contraseña del usuario "postgres" de tu PostgreSQL local: ');
  const admin = new pg.Client({ host: env.DB_HOST, port: Number(env.DB_PORT), user: 'postgres', password: claveAdmin, database: 'postgres' });
  await admin.connect();
  try {
    const usuario = admin.escapeIdentifier(env.DB_USER);
    const clave = admin.escapeLiteral(env.DB_PASSWORD);
    const { rows: roles } = await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [env.DB_USER]);
    await admin.query(roles.length
      ? `ALTER ROLE ${usuario} WITH LOGIN PASSWORD ${clave}`
      : `CREATE ROLE ${usuario} WITH LOGIN PASSWORD ${clave}`);

    const { rows: bases } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [env.DB_NAME]);
    if (!bases.length) await admin.query(`CREATE DATABASE ${admin.escapeIdentifier(env.DB_NAME)} OWNER ${usuario}`);
    console.log(`Base "${env.DB_NAME}" y usuario "${env.DB_USER}" listos.`);
  } finally {
    await admin.end();
  }
};

// Borra todo, crea las tablas desde schema.sql y grupos.sql y carga datos de prueba.
// Saldos, apuestas y ganancias son coherentes entre sí (créditos enteros, pago hacia abajo).
const reiniciarDatos = async (env) => {
  const db = new pg.Client({ host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME });
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await db.query(sqlDe('schema.sql')); // tablas, 18 equipos y 5 partidos futuros

    const hash = await bcrypt.hash(env.CLAVE_PRUEBAS, 10);
    const usuario = async (email, nombre, esAdmin = false) =>
      (await db.query('INSERT INTO usuarios (email, password, nombre, es_admin) VALUES ($1, $2, $3, $4) RETURNING id', [email, hash, nombre, esAdmin])).rows[0].id;
    const admin = await usuario('admin@pruebas.local', 'Admin Pruebas', true); // id 1: creador del grupo de grupos.sql
    const juan = await usuario('juan@pruebas.local', 'Juan Pruebas');
    const maria = await usuario('maria@pruebas.local', 'María Pruebas');

    await db.query(sqlDe('grupos.sql')); // tablas de grupos + "Los Campeones" con el admin
    await db.query("INSERT INTO miembros_grupo (grupo_id, usuario_id, rol) VALUES (1, $1, 'miembro'), (1, $2, 'miembro')", [juan, maria]);

    const partido = async (local, visita, fecha, extra = {}) => (await db.query(
      `INSERT INTO partidos (equipo_local_id, equipo_visitante_id, equipo_local, equipo_visitante, fecha, liga, estado, goles_local, goles_visitante, resultado)
       VALUES ((SELECT id FROM equipos WHERE nombre = $1), (SELECT id FROM equipos WHERE nombre = $2), $1, $2, ${fecha}, 'Primera División', $3, $4, $5, $6)
       RETURNING id`,
      [local, visita, extra.estado ?? 'pendiente', extra.gl ?? null, extra.gv ?? null, extra.resultado ?? null]
    )).rows[0].id;
    const porLiquidar = await partido('Colo-Colo', 'Everton', "NOW() - INTERVAL '3 hours'");
    const finalizado = await partido('Palestino', 'Cobresal', "NOW() - INTERVAL '2 days'", { estado: 'finalizado', gl: 2, gv: 1, resultado: '1' });

    // Apuesta: descuenta el saldo; si ya está liquidada, suma el pago
    const apostar = async (usuarioId, partidoId, monto, prediccion, estado = 'pendiente') => {
      const pago = estado === 'ganada' ? pagoDe(monto, cuotaDe(prediccion)) : 0;
      const ganancia = estado === 'pendiente' ? null : estado === 'ganada' ? pago - monto : -monto;
      await db.query(
        `INSERT INTO apuestas (usuario_id, partido_id, monto, prediccion, cuota, estado, ganancia, fecha_liquidacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, ${estado === 'pendiente' ? 'NULL' : 'NOW()'})`,
        [usuarioId, partidoId, monto, prediccion, cuotaDe(prediccion), estado, ganancia]
      );
      await db.query('UPDATE usuarios SET saldo = saldo - $1 + $2 WHERE id = $3', [monto, pago, usuarioId]);
    };
    await apostar(juan, 1, 50, '1');                     // pendiente en un partido futuro
    await apostar(juan, porLiquidar, 20, '2');           // pendientes en el partido por liquidar
    await apostar(maria, porLiquidar, 30, 'X');
    await apostar(juan, finalizado, 100, '1', 'ganada'); // 100 × 1.85 = 185
    await apostar(maria, finalizado, 40, 'X', 'perdida');

    await db.query('COMMIT');

    const { rows } = await db.query('SELECT email, saldo, es_admin FROM usuarios ORDER BY id');
    console.log('\nDatos de prueba cargados:');
    rows.forEach(u => console.log(`  ${u.email.padEnd(22)} saldo $${u.saldo}${u.es_admin ? ' (administrador)' : ''}`));
    console.log('  Partidos: 5 futuros, 1 jugado por liquidar (Colo-Colo vs Everton) y 1 finalizado.');
    console.log('  Contraseña de las cuentas: CLAVE_PRUEBAS en backend/.env.test');
  } catch (error) {
    await db.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await db.end();
  }
};

const main = async () => {
  const accion = process.argv[2];
  if (!['crear', 'reiniciar'].includes(accion)) {
    throw new Error('Uso: npm run pruebas:crear  |  npm run pruebas:reiniciar');
  }
  if (accion === 'crear') prepararEnv();
  if (!existsSync(archivoEnv)) throw new Error('No existe backend/.env.test. Primero corre: npm run pruebas:crear');

  const env = leerConfig();
  if (accion === 'crear') await crearBase(env);
  await reiniciarDatos(env);
  console.log('\nListo. Backend de pruebas: npm run dev:pruebas (puerto 5001).');
};

main().catch((error) => {
  const mensajes = {
    '28P01': 'Contraseña incorrecta para el usuario de PostgreSQL.',
    ECONNREFUSED: 'No se pudo conectar a PostgreSQL en localhost. ¿Está corriendo el servicio postgresql-x64-16?'
  };
  console.error(`Error: ${mensajes[error.code] ?? error.message}`);
  process.exitCode = 1;
});
