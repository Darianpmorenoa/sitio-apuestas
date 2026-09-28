// Datos y formatos compartidos por las páginas del sitio

export const ODDS = { '1': 1.85, 'X': 3.2, '2': 4.1 }

export const SALDO_INICIAL = 1000

// Pago de una apuesta ganada en créditos enteros: monto × cuota, redondeado hacia abajo.
// Igual que pagoDe en backend/utils/cuotas.js ($5 a cuota 1.85 = 9,25 → $9)
export const pagoPotencial = (monto, cuota) => Math.floor((monto * Math.round(Number(cuota) * 100)) / 100)

// Escudo de cada club con iniciales: [abreviatura, fondo, texto]
const TEAMS = {
  'Colo-Colo': ['CC', '#F2F5F9', '#0A0E14'],
  'Universidad de Chile': ['U', '#1E40AF', '#FFFFFF'],
  'Universidad Católica': ['UC', '#1D4ED8', '#FFFFFF'],
  'Magallanes': ['MAG', '#7DD3FC', '#0A0E14'],
  'Deportes Iquique': ['IQQ', '#38BDF8', '#0A0E14'],
  'Ñublense': ['ÑUB', '#DC2626', '#FFFFFF'],
  "O'Higgins": ['OHI', '#0EA5E9', '#0A0E14'],
  'Audax Italiano': ['AI', '#15803D', '#FFFFFF'],
  'Everton': ['EVE', '#1E3A8A', '#FACC15'],
  'Unión La Calera': ['ULC', '#B91C1C', '#FFFFFF'],
  'Universidad de Concepción': ['UDC', '#FACC15', '#1E3A8A'],
  'Huachipato': ['HUA', '#2563EB', '#0A0E14'],
  'Cobresal': ['COB', '#EA580C', '#FFFFFF'],
  'Coquimbo Unido': ['CQU', '#FACC15', '#0A0E14'],
  'Deportes La Serena': ['DLS', '#9F1239', '#FFFFFF'],
  'Deportes Concepción': ['DCO', '#7C3AED', '#FFFFFF'],
  'Deportes Limache': ['LIM', '#E11D48', '#FFFFFF'],
  'Palestino': ['PAL', '#059669', '#FFFFFF']
}

// Equipos de la Primera División que conoce el sitio
export const TEAM_NAMES = Object.keys(TEAMS)

export const initials = (name = '') =>
  name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

export const teamStyle = (name) => {
  const [abbr, bg, fg] = TEAMS[name] ?? [initials(name), '#33404F', '#F2F5F9']
  return { abbr, bg, fg }
}

// $1.003 (formato chileno; los créditos son enteros)
export const formatMoney = (value) => {
  const n = Math.abs(Number(value) || 0)
  return `$${n.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`
}

// "Hoy · 20:00", "Mañana · 20:00" o "Sáb 27 sep · 17:30"
export const formatKickoff = (fecha) => {
  const date = new Date(fecha)
  const hora = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  if (date.toDateString() === new Date().toDateString()) return `Hoy · ${hora}`
  if (date.toDateString() === manana.toDateString()) return `Mañana · ${hora}`
  const dia = date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} · ${hora}`
}
