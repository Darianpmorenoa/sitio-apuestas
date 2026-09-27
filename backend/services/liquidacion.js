import { cuotaDe } from '../utils/cuotas.js';

// Estados posibles
// partidos: pendiente → finalizado | suspendido
// apuestas: pendiente → ganada | perdida | anulada

const redondear = (n) => Math.round(n * 100) / 100;

export class LiquidacionError extends Error {}

// '1' si gana el local, 'X' si empatan, '2' si gana la visita
export const resultadoDe = (golesLocal, golesVisitante) =>
  golesLocal > golesVisitante ? '1' : golesLocal < golesVisitante ? '2' : 'X';

// Qué le pasa a una apuesta según el resultado del partido.
// ganancia: ganancia neta que se guarda en la apuesta.
// pago: lo que se suma al saldo (el monto ya se descontó al apostar).
export const calcularLiquidacion = (apuesta, resultado) => {
  const monto = parseFloat(apuesta.monto);
  const cuota = parseFloat(apuesta.cuota ?? cuotaDe(apuesta.prediccion));

  if (apuesta.prediccion === resultado) {
    const pago = redondear(monto * cuota);
    return { estado: 'ganada', ganancia: redondear(pago - monto), pago };
  }
  return { estado: 'perdida', ganancia: -monto, pago: 0 };
};

const validarGoles = (valor, nombre) => {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 0 || n > 99) {
    throw new LiquidacionError(`${nombre} debe ser un número entero entre 0 y 99`);
  }
  return n;
};

// Bloquea el partido y verifica que se pueda liquidar
const obtenerPartidoPendiente = async (client, partidoId) => {
  const { rows } = await client.query('SELECT * FROM partidos WHERE id = $1 FOR UPDATE', [partidoId]);
  const partido = rows[0];
  if (!partido) throw new LiquidacionError(`No existe el partido ${partidoId}`);
  if (partido.estado !== 'pendiente') {
    throw new LiquidacionError(`El partido ${partidoId} ya está ${partido.estado}; no se puede liquidar de nuevo`);
  }
  return partido;
};

const apuestasPendientes = async (client, partidoId) => {
  const { rows } = await client.query(
    "SELECT * FROM apuestas WHERE partido_id = $1 AND estado = 'pendiente' ORDER BY id FOR UPDATE",
    [partidoId]
  );
  return rows;
};

const sumarSaldo = (client, usuarioId, monto) =>
  client.query('UPDATE usuarios SET saldo = saldo + $1 WHERE id = $2', [monto, usuarioId]);

// Registra el marcador y liquida todas las apuestas pendientes del partido.
// Debe llamarse dentro de una transacción (BEGIN/COMMIT) que maneja quien llama.
export const liquidarPartido = async (client, partidoId, { golesLocal, golesVisitante }, { ahora = new Date() } = {}) => {
  const gl = validarGoles(golesLocal, 'Los goles del local');
  const gv = validarGoles(golesVisitante, 'Los goles de la visita');

  const partido = await obtenerPartidoPendiente(client, partidoId);
  if (new Date(partido.fecha) > ahora) {
    throw new LiquidacionError(`El partido ${partidoId} todavía no se juega (${new Date(partido.fecha).toLocaleString('es-CL')})`);
  }

  const resultado = resultadoDe(gl, gv);
  await client.query(
    "UPDATE partidos SET goles_local = $1, goles_visitante = $2, resultado = $3, estado = 'finalizado' WHERE id = $4",
    [gl, gv, resultado, partidoId]
  );

  const resumen = { partido: `${partido.equipo_local} ${gl}-${gv} ${partido.equipo_visitante}`, resultado, ganadas: 0, perdidas: 0, pagado: 0 };

  for (const apuesta of await apuestasPendientes(client, partidoId)) {
    const { estado, ganancia, pago } = calcularLiquidacion(apuesta, resultado);
    await client.query(
      'UPDATE apuestas SET estado = $1, ganancia = $2, fecha_liquidacion = NOW() WHERE id = $3',
      [estado, ganancia, apuesta.id]
    );
    if (pago > 0) await sumarSaldo(client, apuesta.usuario_id, pago);

    if (estado === 'ganada') resumen.ganadas++;
    else resumen.perdidas++;
    resumen.pagado = redondear(resumen.pagado + pago);
  }

  return resumen;
};

// Marca el partido como suspendido y devuelve lo apostado a cada usuario.
export const anularPartido = async (client, partidoId) => {
  const partido = await obtenerPartidoPendiente(client, partidoId);
  await client.query("UPDATE partidos SET estado = 'suspendido' WHERE id = $1", [partidoId]);

  const resumen = { partido: `${partido.equipo_local} vs ${partido.equipo_visitante}`, anuladas: 0, devuelto: 0 };

  for (const apuesta of await apuestasPendientes(client, partidoId)) {
    const monto = parseFloat(apuesta.monto);
    await client.query(
      "UPDATE apuestas SET estado = 'anulada', ganancia = 0, fecha_liquidacion = NOW() WHERE id = $1",
      [apuesta.id]
    );
    await sumarSaldo(client, apuesta.usuario_id, monto);
    resumen.anuladas++;
    resumen.devuelto = redondear(resumen.devuelto + monto);
  }

  return resumen;
};
