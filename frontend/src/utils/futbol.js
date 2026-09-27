// Datos y formatos compartidos por las páginas del sitio

export const ODDS = { '1': 1.85, 'X': 3.2, '2': 4.1 }

export const SALDO_INICIAL = 1000

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
  'Unión La Calera': ['ULC', '#B91C1C', '#FFFFFF']
}

// Equipos de la Primera División que conoce el sitio
export const TEAM_NAMES = Object.keys(TEAMS)

export const initials = (name = '') =>
  name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

export const teamStyle = (name) => {
  const [abbr, bg, fg] = TEAMS[name] ?? [initials(name), '#33404F', '#F2F5F9']
  return { abbr, bg, fg }
}

// $1.003 o $92,50 (formato chileno, sin decimales si el monto es entero)
export const formatMoney = (value) => {
  const n = Math.abs(Number(value) || 0)
  const decimals = Number.isInteger(n) ? 0 : 2
  return `$${n.toLocaleString('es-CL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
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
