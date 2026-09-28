import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearApuesta, ApuestaError } from '../services/apuestas.js';

const ahora = new Date('2026-10-01T12:00:00Z');

// Cliente falso que simula la base de datos en memoria y anota cada consulta
const crearClienteFalso = ({ partido, saldo = 1000, usuarioExiste = true } = {}) => {
  const db = {
    consultas: [],
    saldo,
    apuestas: [],
    async query(sql, params = []) {
      db.consultas.push(sql);
      if (sql.startsWith('SELECT id, fecha, estado FROM partidos')) {
        return { rows: partido && partido.id === Number(params[0]) ? [partido] : [] };
      }
      if (sql.startsWith('SELECT saldo FROM usuarios')) return { rows: usuarioExiste ? [{ saldo: db.saldo }] : [] };
      if (sql.startsWith('UPDATE usuarios SET saldo = saldo - $1')) {
        if (db.saldo < params[0]) return { rows: [] };
        db.saldo -= params[0];
        return { rows: [{ saldo: db.saldo }] };
      }
      if (sql.startsWith('INSERT INTO apuestas')) {
        const [usuario_id, partido_id, monto, prediccion, cuota, estado] = params;
        const apuesta = { id: db.apuestas.length + 1, usuario_id, partido_id, monto, prediccion, cuota, estado };
        db.apuestas.push(apuesta);
        return { rows: [apuesta] };
      }
      throw new Error(`Consulta no esperada: ${sql}`);
    }
  };
  return db;
};

const partidoFuturo = () => ({ id: 7, fecha: '2026-10-02T23:00:00Z', estado: 'pendiente' });
const datos = { partido_id: 7, monto: 50, prediccion: 'X' };

// Ninguna consulta que cambie datos
const soloLecturas = (db) => db.consultas.every(sql => sql.startsWith('SELECT'));

test('crearApuesta: descuenta el saldo y guarda la apuesta con su cuota', async () => {
  const db = crearClienteFalso({ partido: partidoFuturo() });
  const r = await crearApuesta(db, 3, datos, { ahora });

  assert.equal(r.saldo, 950);
  assert.equal(db.saldo, 950);
  assert.deepEqual(db.apuestas, [{ id: 1, usuario_id: 3, partido_id: 7, monto: 50, prediccion: 'X', cuota: 3.2, estado: 'pendiente' }]);
  assert.ok(Number.isInteger(r.saldo));
});

test('crearApuesta: bloquea primero el partido y después el usuario (mismo orden que la liquidación)', async () => {
  const db = crearClienteFalso({ partido: partidoFuturo() });
  await crearApuesta(db, 3, datos, { ahora });

  assert.match(db.consultas[0], /FROM partidos .* FOR SHARE$/);
  assert.match(db.consultas[1], /FROM usuarios .* FOR UPDATE$/);
});

test('crearApuesta: permite apostar todo el saldo', async () => {
  const db = crearClienteFalso({ partido: partidoFuturo(), saldo: 50 });
  assert.equal((await crearApuesta(db, 3, datos, { ahora })).saldo, 0);
});

test('crearApuesta: rechaza datos inválidos sin tocar la base', async () => {
  const casos = [
    [{}, /requeridos/],
    [{ ...datos, prediccion: '3' }, /Predicción inválida/],
    [{ ...datos, partido_id: 'abc' }, /Partido inválido/],
    [{ ...datos, partido_id: 1.5 }, /Partido inválido/]
  ];
  for (const [entrada, error] of casos) {
    const db = crearClienteFalso({ partido: partidoFuturo() });
    await assert.rejects(crearApuesta(db, 3, entrada, { ahora }), error);
    assert.equal(db.consultas.length, 0);
  }
});

test('crearApuesta: rechaza montos que no son créditos enteros válidos', async () => {
  const casos = [
    [12.5, /entero/],
    [0.001, /entero/],
    ['50', /entero/],
    [0, /mínimo/],
    [-10, /mínimo/],
    [100001, /máximo/],
    [1001, /Saldo insuficiente/]
  ];
  for (const [monto, error] of casos) {
    const db = crearClienteFalso({ partido: partidoFuturo() });
    await assert.rejects(crearApuesta(db, 3, { ...datos, monto }, { ahora }), error, `monto ${monto}`);
    assert.ok(soloLecturas(db), `monto ${monto} no debe cambiar datos`);
    assert.equal(db.saldo, 1000);
  }
});

test('crearApuesta: rechaza partidos inexistentes, cerrados o que ya empezaron', async () => {
  const casos = [
    [null, /Partido no encontrado/, 404],
    [{ ...partidoFuturo(), estado: 'finalizado' }, /ya no acepta apuestas/, 400],
    [{ ...partidoFuturo(), estado: 'suspendido' }, /ya no acepta apuestas/, 400],
    [{ ...partidoFuturo(), fecha: '2026-10-01T11:59:00Z' }, /ya han comenzado/, 400],
    [{ ...partidoFuturo(), fecha: ahora.toISOString() }, /ya han comenzado/, 400]
  ];
  for (const [partido, mensaje, status] of casos) {
    const db = crearClienteFalso({ partido });
    await assert.rejects(crearApuesta(db, 3, datos, { ahora }), (e) => e instanceof ApuestaError && mensaje.test(e.message) && e.status === status);
    assert.ok(soloLecturas(db));
    assert.equal(db.saldo, 1000);
  }
});

test('crearApuesta: usuario inexistente responde 404', async () => {
  const db = crearClienteFalso({ partido: partidoFuturo(), usuarioExiste: false });
  await assert.rejects(crearApuesta(db, 3, datos, { ahora }), (e) => e.status === 404);
});

test('crearApuesta: no registra la apuesta si el descuento de saldo falla', async () => {
  const db = crearClienteFalso({ partido: partidoFuturo() });
  // Simula que el saldo bajó entre la lectura y el descuento
  const queryOriginal = db.query;
  db.query = async (sql, params) => {
    if (sql.startsWith('UPDATE usuarios')) return { rows: [] };
    return queryOriginal(sql, params);
  };
  await assert.rejects(crearApuesta(db, 3, datos, { ahora }), /Saldo insuficiente/);
  assert.equal(db.apuestas.length, 0);
});

test('crearApuesta: falla si la base devuelve un saldo con decimales (migración 004 sin aplicar)', async () => {
  const db = crearClienteFalso({ partido: partidoFuturo(), saldo: '992.50' });
  await assert.rejects(crearApuesta(db, 3, datos, { ahora }), /no entero/);
  assert.equal(db.apuestas.length, 0);
});
