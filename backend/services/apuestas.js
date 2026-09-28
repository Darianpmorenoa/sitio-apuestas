import { cuotaDe, creditosDe } from '../utils/cuotas.js';
import { validateBetAmount, esIdValido } from '../utils/validators.js';

// Error que se muestra al usuario tal cual, con su código HTTP
export class ApuestaError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Registra una apuesta y descuenta el monto del saldo.
// Debe llamarse dentro de una transacción (BEGIN/COMMIT) que maneja quien llama:
// las validaciones leen filas bloqueadas, así nada cambia entre revisar y descontar.
export const crearApuesta = async (client, usuarioId, { partido_id, monto, prediccion } = {}, { ahora = new Date() } = {}) => {
  if (partido_id == null || monto == null || !prediccion) {
    throw new ApuestaError('Partido, monto y predicción son requeridos');
  }
  if (!['1', 'X', '2'].includes(prediccion)) throw new ApuestaError('Predicción inválida');
  if (!esIdValido(partido_id)) throw new ApuestaError('Partido inválido');

  // Primero el partido y después el usuario, el mismo orden que la liquidación (evita bloqueos cruzados).
  // FOR SHARE: si un administrador está liquidando o suspendiendo el partido, se espera a que termine.
  const { rows: partidos } = await client.query(
    'SELECT id, fecha, estado FROM partidos WHERE id = $1 FOR SHARE',
    [partido_id]
  );
  const partido = partidos[0];
  if (!partido) throw new ApuestaError('Partido no encontrado', 404);
  if (partido.estado !== 'pendiente') throw new ApuestaError('Este partido ya no acepta apuestas');
  if (new Date(partido.fecha) <= ahora) {
    throw new ApuestaError('No se puede apostar en partidos que ya han comenzado');
  }

  // FOR UPDATE: dos apuestas simultáneas del mismo usuario no pueden gastar el mismo saldo
  const { rows: usuarios } = await client.query('SELECT saldo FROM usuarios WHERE id = $1 FOR UPDATE', [usuarioId]);
  if (!usuarios[0]) throw new ApuestaError('Usuario no encontrado', 404);

  const validacion = validateBetAmount(monto, creditosDe(usuarios[0].saldo));
  if (!validacion.valid) throw new ApuestaError(validacion.error);

  const { rows: saldos } = await client.query(
    'UPDATE usuarios SET saldo = saldo - $1 WHERE id = $2 AND saldo >= $1 RETURNING saldo',
    [monto, usuarioId]
  );
  if (!saldos[0]) throw new ApuestaError('Saldo insuficiente');

  const { rows: apuestas } = await client.query(
    'INSERT INTO apuestas (usuario_id, partido_id, monto, prediccion, cuota, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [usuarioId, partido_id, monto, prediccion, cuotaDe(prediccion), 'pendiente']
  );

  return { apuesta: apuestas[0], saldo: creditosDe(saldos[0].saldo) };
};
