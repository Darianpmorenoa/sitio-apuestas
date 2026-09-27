export class PartidoError extends Error {}

const LIGA = 'Primera División';
const UN_ANIO_MS = 365 * 24 * 60 * 60 * 1000;
// Un equipo no juega dos partidos con menos de este margen
const MARGEN_ENTRE_PARTIDOS = '24 hours';

const textoRequerido = (valor, nombre) => {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto) throw new PartidoError(`${nombre} es requerido`);
  return texto;
};

// Revisa los datos de un partido nuevo. `fecha` debe venir en formato ISO (con zona horaria).
export const validarNuevoPartido = ({ equipoLocal, equipoVisitante, fecha }, { ahora = new Date() } = {}) => {
  const local = textoRequerido(equipoLocal, 'El equipo local');
  const visita = textoRequerido(equipoVisitante, 'El equipo visitante');
  if (local === visita) throw new PartidoError('El local y la visita deben ser equipos distintos');

  const inicio = new Date(fecha);
  if (!fecha || Number.isNaN(inicio.getTime())) throw new PartidoError('La fecha del partido no es válida');
  if (inicio <= ahora) throw new PartidoError('La fecha del partido debe ser futura');
  if (inicio - ahora > UN_ANIO_MS) throw new PartidoError('La fecha del partido debe estar dentro del próximo año');

  return { equipoLocal: local, equipoVisitante: visita, fecha: inicio };
};

// Crea el partido si ambos equipos existen y ninguno tiene otro partido cerca de esa fecha.
export const crearPartido = async (client, datos, opciones) => {
  const { equipoLocal, equipoVisitante, fecha } = validarNuevoPartido(datos, opciones);

  const { rows: equipos } = await client.query(
    'SELECT id, nombre FROM equipos WHERE nombre = ANY($1)',
    [[equipoLocal, equipoVisitante]]
  );
  const idDe = (nombre) => equipos.find(e => e.nombre === nombre)?.id;
  for (const nombre of [equipoLocal, equipoVisitante]) {
    if (!idDe(nombre)) throw new PartidoError(`No existe el equipo "${nombre}"`);
  }

  const { rows: choques } = await client.query(
    `SELECT equipo_local, equipo_visitante FROM partidos
     WHERE estado <> 'suspendido'
       AND (equipo_local = ANY($1) OR equipo_visitante = ANY($1))
       AND fecha BETWEEN $2::timestamp - $3::interval AND $2::timestamp + $3::interval
     LIMIT 1`,
    [[equipoLocal, equipoVisitante], fecha, MARGEN_ENTRE_PARTIDOS]
  );
  if (choques.length > 0) {
    const c = choques[0];
    throw new PartidoError(`Ya hay un partido cerca de esa fecha: ${c.equipo_local} vs ${c.equipo_visitante}`);
  }

  const { rows } = await client.query(
    `INSERT INTO partidos (equipo_local_id, equipo_visitante_id, equipo_local, equipo_visitante, fecha, liga, estado)
     VALUES ($1, $2, $3, $4, $5, $6, 'pendiente') RETURNING *`,
    [idDe(equipoLocal), idDe(equipoVisitante), equipoLocal, equipoVisitante, fecha, LIGA]
  );
  return rows[0];
};
