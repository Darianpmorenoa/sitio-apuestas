import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resultadoDe, calcularLiquidacion, liquidarPartido, anularPartido, LiquidacionError } from '../services/liquidacion.js';

test('resultadoDe: local, empate y visita', () => {
  assert.equal(resultadoDe(2, 0), '1');
  assert.equal(resultadoDe(1, 1), 'X');
  assert.equal(resultadoDe(0, 3), '2');
});

test('calcularLiquidacion: apuesta ganada usa la cuota guardada y paga redondeando hacia abajo', () => {
  // 50 × 1.85 = 92,5 → paga 92
  const r = calcularLiquidacion({ monto: 50, prediccion: '1', cuota: '1.85' }, '1');
  assert.deepEqual(r, { estado: 'ganada', ganancia: 42, pago: 92 });
});

test('calcularLiquidacion: sin cuota guardada usa la cuota fija del pronóstico', () => {
  const r = calcularLiquidacion({ monto: 10, prediccion: 'X', cuota: null }, 'X');
  assert.deepEqual(r, { estado: 'ganada', ganancia: 22, pago: 32 });
});

test('calcularLiquidacion: apuesta perdida no paga y pierde el monto', () => {
  const r = calcularLiquidacion({ monto: 30, prediccion: '2', cuota: '4.10' }, '1');
  assert.deepEqual(r, { estado: 'perdida', ganancia: -30, pago: 0 });
});

test('calcularLiquidacion: los pagos son siempre enteros y nunca se redondean hacia arriba', () => {
  const casos = [
    // [monto, cuota, pago esperado]
    [5, '1.85', 9],      // 9,25
    [1, '1.85', 1],      // 1,85
    [3, '3.20', 9],      // 9,6
    [7, '4.10', 28],     // 28,7
    [100, '1.85', 185],  // exacto
    [100000, '4.10', 410000]
  ];
  for (const [monto, cuota, pago] of casos) {
    const r = calcularLiquidacion({ monto, prediccion: '1', cuota }, '1');
    assert.equal(r.pago, pago, `${monto} × ${cuota}`);
    assert.equal(r.ganancia, pago - monto);
    assert.ok(Number.isInteger(r.pago) && Number.isInteger(r.ganancia));
  }
});

test('calcularLiquidacion: acepta montos enteros que la base devuelve como texto', () => {
  assert.equal(calcularLiquidacion({ monto: '20.00', prediccion: 'X', cuota: '3.20' }, 'X').pago, 64);
});

test('calcularLiquidacion: rechaza montos con decimales (créditos no enteros)', () => {
  assert.throws(() => calcularLiquidacion({ monto: '33.33', prediccion: '2', cuota: '4.10' }, '2'), /no entero/);
});

// Cliente falso que simula la base de datos en memoria
const crearClienteFalso = ({ partido, apuestas, saldos }) => {
  const consultas = [];
  return {
    consultas,
    saldos,
    apuestas,
    partido,
    async query(sql, params = []) {
      consultas.push(sql);
      if (sql.startsWith('SELECT * FROM partidos')) return { rows: partido && partido.id === params[0] ? [partido] : [] };
      if (sql.startsWith('SELECT * FROM apuestas')) return { rows: apuestas.filter(a => a.estado === 'pendiente') };
      if (sql.startsWith('UPDATE partidos SET goles_local')) {
        Object.assign(partido, { goles_local: params[0], goles_visitante: params[1], resultado: params[2], estado: 'finalizado' });
        return { rows: [] };
      }
      if (sql.startsWith("UPDATE partidos SET estado = 'suspendido'")) { partido.estado = 'suspendido'; return { rows: [] }; }
      if (sql.startsWith('UPDATE apuestas SET estado = $1')) {
        Object.assign(apuestas.find(a => a.id === params[2]), { estado: params[0], ganancia: params[1] });
        return { rows: [] };
      }
      if (sql.startsWith("UPDATE apuestas SET estado = 'anulada'")) {
        Object.assign(apuestas.find(a => a.id === params[0]), { estado: 'anulada', ganancia: 0 });
        return { rows: [] };
      }
      if (sql.startsWith('UPDATE usuarios SET saldo')) { saldos[params[1]] += params[0]; return { rows: [] }; }
      throw new Error(`Consulta no esperada: ${sql}`);
    }
  };
};

const datosDePrueba = () => ({
  partido: { id: 7, equipo_local: 'Colo-Colo', equipo_visitante: 'Universidad de Chile', fecha: '2026-01-01T20:00:00Z', estado: 'pendiente' },
  apuestas: [
    { id: 1, usuario_id: 10, monto: 50, prediccion: '1', cuota: '1.85', estado: 'pendiente' },
    { id: 2, usuario_id: 11, monto: 20, prediccion: 'X', cuota: '3.20', estado: 'pendiente' },
    { id: 3, usuario_id: 10, monto: 10, prediccion: '2', cuota: '4.10', estado: 'pendiente' }
  ],
  saldos: { 10: 900, 11: 980 }
});

test('liquidarPartido: marca el partido, liquida apuestas y paga a los ganadores', async () => {
  const db = crearClienteFalso(datosDePrueba());
  const resumen = await liquidarPartido(db, 7, { golesLocal: '2', golesVisitante: '1' });

  assert.equal(db.partido.estado, 'finalizado');
  assert.equal(db.partido.resultado, '1');
  assert.deepEqual(db.apuestas.map(a => [a.estado, a.ganancia]), [['ganada', 42], ['perdida', -20], ['perdida', -10]]);
  assert.deepEqual(db.saldos, { 10: 992, 11: 980 });
  assert.deepEqual(resumen, { partido: 'Colo-Colo 2-1 Universidad de Chile', resultado: '1', ganadas: 1, perdidas: 2, pagado: 92 });
});

test('liquidarPartido: no liquida dos veces el mismo partido', async () => {
  const db = crearClienteFalso(datosDePrueba());
  await liquidarPartido(db, 7, { golesLocal: 0, golesVisitante: 0 });
  await assert.rejects(liquidarPartido(db, 7, { golesLocal: 1, golesVisitante: 0 }), LiquidacionError);
  assert.deepEqual(db.saldos, { 10: 900, 11: 1044 });
});

test('liquidarPartido: rechaza partidos que todavía no se juegan', async () => {
  const db = crearClienteFalso(datosDePrueba());
  await assert.rejects(
    liquidarPartido(db, 7, { golesLocal: 1, golesVisitante: 0 }, { ahora: new Date('2025-12-31T00:00:00Z') }),
    /todavía no se juega/
  );
  assert.equal(db.partido.estado, 'pendiente');
});

test('liquidarPartido: rechaza goles inválidos y partidos inexistentes', async () => {
  const db = crearClienteFalso(datosDePrueba());
  await assert.rejects(liquidarPartido(db, 7, { golesLocal: -1, golesVisitante: 0 }), /entero entre 0 y 99/);
  await assert.rejects(liquidarPartido(db, 7, { golesLocal: '1.5', golesVisitante: 0 }), /entero entre 0 y 99/);
  await assert.rejects(liquidarPartido(db, 99, { golesLocal: 1, golesVisitante: 0 }), /No existe el partido 99/);
});

test('anularPartido: suspende el partido y devuelve lo apostado', async () => {
  const db = crearClienteFalso(datosDePrueba());
  const resumen = await anularPartido(db, 7);

  assert.equal(db.partido.estado, 'suspendido');
  assert.ok(db.apuestas.every(a => a.estado === 'anulada' && a.ganancia === 0));
  assert.deepEqual(db.saldos, { 10: 960, 11: 1000 });
  assert.deepEqual(resumen, { partido: 'Colo-Colo vs Universidad de Chile', anuladas: 3, devuelto: 80 });
});
