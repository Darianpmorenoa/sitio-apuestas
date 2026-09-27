import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarNuevoPartido, crearPartido, PartidoError } from '../services/partidos.js';

const ahora = new Date('2026-09-26T12:00:00Z');
const datos = { equipoLocal: 'Colo-Colo', equipoVisitante: 'Everton', fecha: '2026-10-04T20:00:00.000Z' };

test('validarNuevoPartido: acepta un partido válido y limpia los nombres', () => {
  const r = validarNuevoPartido({ ...datos, equipoLocal: '  Colo-Colo ' }, { ahora });
  assert.deepEqual(r, { equipoLocal: 'Colo-Colo', equipoVisitante: 'Everton', fecha: new Date(datos.fecha) });
});

test('validarNuevoPartido: rechaza datos incompletos o inválidos', () => {
  const casos = [
    [{ ...datos, equipoLocal: '' }, /local es requerido/],
    [{ ...datos, equipoVisitante: undefined }, /visitante es requerido/],
    [{ ...datos, equipoVisitante: 'Colo-Colo' }, /equipos distintos/],
    [{ ...datos, fecha: 'mañana' }, /no es válida/],
    [{ ...datos, fecha: '2026-09-26T11:00:00Z' }, /debe ser futura/],
    [{ ...datos, fecha: '2028-01-01T00:00:00Z' }, /próximo año/]
  ];
  for (const [entrada, mensaje] of casos) {
    assert.throws(() => validarNuevoPartido(entrada, { ahora }), (e) => e instanceof PartidoError && mensaje.test(e.message));
  }
});

// Cliente falso: responde según el tipo de consulta
const crearCliente = ({ equipos = [{ id: 1, nombre: 'Colo-Colo' }, { id: 9, nombre: 'Everton' }], choques = [] } = {}) => ({
  insertado: null,
  async query(sql, params) {
    if (sql.startsWith('SELECT id, nombre FROM equipos')) return { rows: equipos.filter(e => params[0].includes(e.nombre)) };
    if (sql.includes('FROM partidos')) return { rows: choques };
    if (sql.startsWith('INSERT INTO partidos')) { this.insertado = params; return { rows: [{ id: 6 }] }; }
    throw new Error(`Consulta no esperada: ${sql}`);
  }
});

test('crearPartido: guarda los ids y nombres de ambos equipos', async () => {
  const client = crearCliente();
  const partido = await crearPartido(client, datos, { ahora });
  assert.deepEqual(partido, { id: 6 });
  assert.deepEqual(client.insertado, [1, 9, 'Colo-Colo', 'Everton', new Date(datos.fecha), 'Primera División']);
});

test('crearPartido: rechaza un equipo que no existe', async () => {
  const client = crearCliente({ equipos: [{ id: 1, nombre: 'Colo-Colo' }] });
  await assert.rejects(crearPartido(client, datos, { ahora }), /No existe el equipo "Everton"/);
  assert.equal(client.insertado, null);
});

test('crearPartido: rechaza si un equipo ya juega cerca de esa fecha', async () => {
  const client = crearCliente({ choques: [{ equipo_local: 'Everton', equipo_visitante: "O'Higgins" }] });
  await assert.rejects(crearPartido(client, datos, { ahora }), /Everton vs O'Higgins/);
  assert.equal(client.insertado, null);
});
