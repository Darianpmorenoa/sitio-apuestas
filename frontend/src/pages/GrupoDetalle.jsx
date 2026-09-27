import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { formatMoney, formatKickoff } from '../utils/futbol'
import { groupInitials, groupTile } from '../utils/grupos'

const API = 'http://localhost:5000/api/grupos'

// Colores de avatar para los miembros [fondo, texto], elegidos por su id
const AVATAR_COLORS = [
  ['#0E3B4A', '#9BE7FF'], ['#2B1F5C', '#D9CCFF'], ['#3F2A12', '#FFD29B'], ['#123A2A', '#9CF2C8'],
  ['#1E2A44', '#A9C3FF'], ['#3A1424', '#FFB3CB'], ['#33240E', '#FFD9A0'], ['#26263A', '#CFCFFF']
]

const STATUS = {
  pendiente: { label: 'Pendiente', className: 'bg-ambar-suave text-ambar' },
  ganada: { label: 'Ganada', className: 'bg-volt-suave text-volt' },
  perdida: { label: 'Perdida', className: 'bg-roja-suave text-roja' }
}

const personInitials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'

function Avatar({ id, name, size = 'h-8 w-8 text-xs' }) {
  const [bg, fg] = AVATAR_COLORS[(Number(id) || 0) % AVATAR_COLORS.length]
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${size}`} style={{ backgroundColor: bg, color: fg }} aria-hidden="true">
      {personInitials(name)}
    </span>
  )
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`flex flex-col gap-3 rounded-3xl border border-linea bg-grada p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-1 font-display text-3xl uppercase italic leading-none">{title}</h2>}
      {children}
    </section>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z" />
      <path d="M9 9.5c.5 2 2 3.5 4.5 4.5l1.2-1.2 2 1-.4 1.6c-3.5.3-7.6-3.8-7.3-7.3L10.6 7.7l1 2z" />
    </svg>
  )
}

export default function GrupoDetalle({ token, user }) {
  const { id } = useParams()
  const [grupo, setGrupo] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [apuestas, setApuestas] = useState([])
  const [miRol, setMiRol] = useState('miembro')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkWhatsApp, setLinkWhatsApp] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    fetchGrupoDetalle()
  }, [id])

  useEffect(() => {
    if (!copiado) return
    const timer = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(timer)
  }, [copiado])

  const fetchGrupoDetalle = async () => {
    setLoading(true)
    setError('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios.get(`${API}/${id}`, { headers })
      setGrupo(response.data.grupo)
      setMiembros(response.data.miembros)
      setApuestas(response.data.apuestas)
      setMiRol(response.data.mi_rol)

      // Solo el admin puede generar la invitación por WhatsApp
      if (response.data.mi_rol === 'admin') {
        axios.get(`${API}/${id}/whatsapp`, { headers })
          .then(({ data }) => setLinkWhatsApp(data.linkWhatsApp))
          .catch(() => {})
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el grupo')
    } finally {
      setLoading(false)
    }
  }

  const handleCopiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(grupo.codigo_invitacion)
      setCopiado(true)
    } catch {
      setError('No se pudo copiar. Selecciona el código y cópialo manualmente.')
    }
  }

  const backLink = (
    <Link to="/grupos" className="flex h-11 items-center gap-2 self-start text-sm font-bold text-niebla no-underline hover:text-tiza">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></svg>
      Volver a mis grupos
    </Link>
  )

  const shell = (children) => (
    <div className="min-h-screen bg-noche font-body text-tiza">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-4 pb-20 pt-8 sm:px-8 lg:pt-10 xl:px-12 2xl:px-20">
        {backLink}
        {children}
      </div>
    </div>
  )

  if (loading) {
    return shell(
      <div className="flex flex-col gap-6" aria-hidden="true">
        <div className="h-44 animate-pulse rounded-[28px] bg-grada" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-96 animate-pulse rounded-3xl bg-grada" />
          <div className="h-72 animate-pulse rounded-3xl bg-grada" />
        </div>
      </div>
    )
  }

  if (!grupo) {
    return shell(
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-linea-fuerte px-6 py-16 text-center">
        <h1 className="font-display text-4xl uppercase italic">Grupo no disponible</h1>
        <p className="text-niebla">{error || 'Este grupo no existe.'}</p>
      </div>
    )
  }

  const ranking = [...miembros].sort((a, b) => parseFloat(b.saldo) - parseFloat(a.saldo))
  const myIndex = ranking.findIndex(m => m.id === user?.id)
  const leaderGap = myIndex > 0 ? parseFloat(ranking[0].saldo) - parseFloat(ranking[myIndex].saldo) : 0

  return shell(
    <>
      {error && (
        <div role="alert" className="rounded-[14px] border border-roja-borde bg-roja-suave px-4 py-3.5 text-sm font-semibold text-roja">{error}</div>
      )}

      <header className="flex flex-col gap-6 rounded-[28px] border border-linea bg-grada p-6 sm:flex-row sm:items-center sm:gap-7 sm:p-8">
        <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl font-display text-4xl italic sm:h-[104px] sm:w-[104px] sm:text-5xl ${groupTile(grupo.id)}`}>
          {groupInitials(grupo.nombre)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h1 className="break-words font-display text-5xl uppercase italic leading-[0.9] sm:text-6xl">{grupo.nombre}</h1>
          <p className="text-base text-niebla">{grupo.descripcion || 'Sin descripción'}</p>
          <div className="flex flex-wrap gap-2">
            <span className="flex h-7 items-center rounded-full border border-[#2A3545] bg-pasto px-3 text-xs font-bold text-niebla">
              {miembros.length} {miembros.length === 1 ? 'miembro' : 'miembros'}
            </span>
            {miRol === 'admin' && (
              <span className="flex h-7 items-center rounded-full bg-volt-suave px-3 text-xs font-extrabold text-volt">Eres admin</span>
            )}
          </div>
        </div>
        {myIndex >= 0 && (
          <div className="flex flex-row items-baseline gap-3 sm:flex-col sm:items-end sm:gap-1">
            <span className="text-xs font-extrabold tracking-[0.12em] text-gris">TU PUESTO</span>
            <span className="font-display text-6xl italic leading-[0.85] sm:text-8xl">#{myIndex + 1}</span>
            <span className="text-[13px] text-gris">
              {myIndex === 0 ? (ranking.length > 1 ? 'Vas liderando' : 'Invita a alguien para competir') : `a ${formatMoney(leaderGap)} del líder`}
            </span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Ranking">
            <p className="-mt-1 text-[13px] text-gris">Ordenado por saldo actual. Todos parten con $1.000.</p>
            <div className="hidden grid-cols-[48px_minmax(0,1fr)_96px_110px] gap-3 px-4 pt-2 text-xs font-extrabold tracking-wider text-gris sm:grid">
              <span>POS</span><span>MIEMBRO</span><span className="text-right">APUESTAS</span><span className="text-right">SALDO</span>
            </div>
            <ol className="flex flex-col gap-2 pl-0">
              {ranking.map((m, i) => {
                const me = m.id === user?.id
                return (
                  <li
                    key={m.id}
                    className={`grid min-h-14 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border px-4 py-2 sm:grid-cols-[48px_minmax(0,1fr)_96px_110px] ${me ? 'border-[#4A6417] bg-volt-suave' : 'border-transparent bg-pasto'}`}
                  >
                    <span className={`font-display text-2xl italic ${i === 0 ? 'text-volt' : i < 3 ? 'text-tiza' : 'text-gris'}`}>{i + 1}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar id={m.id} name={m.nombre} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[15px] font-bold">{me ? `${m.nombre} (tú)` : m.nombre}</span>
                        {m.rol === 'admin' && <span className="text-xs text-gris">Admin</span>}
                      </span>
                    </span>
                    <span className="hidden text-right font-cifras text-sm text-niebla sm:block">{m.total_apuestas ?? 0}</span>
                    <span className="text-right font-cifras text-[15px] font-bold">{formatMoney(m.saldo)}</span>
                  </li>
                )
              })}
            </ol>
          </Card>

          <Card title="Últimas apuestas del grupo">
            {apuestas.length === 0 ? (
              <p className="text-niebla">Nadie del grupo ha apostado todavía. ¡Sé el primero!</p>
            ) : (
              <ul className="flex flex-col gap-2 pl-0">
                {apuestas.map(a => {
                  const status = STATUS[a.estado] ?? STATUS.pendiente
                  const me = a.usuario_id === user?.id
                  return (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-[14px] bg-pasto px-4 py-3">
                      <Avatar id={a.usuario_id} name={a.usuario_nombre} />
                      <span className="min-w-0 flex-1 text-sm leading-relaxed text-niebla">
                        <strong className="text-tiza">{me ? 'Tú' : a.usuario_nombre}</strong> {me ? 'apostaste' : 'apostó'}{' '}
                        <strong className="font-cifras text-tiza">{formatMoney(a.monto)}</strong> al{' '}
                        <strong className="font-cifras text-tiza">{a.prediccion}</strong> en {a.equipo_local} vs {a.equipo_visitante}
                        {a.fecha_partido && <span className="text-gris"> · {formatKickoff(a.fecha_partido)}</span>}
                      </span>
                      <span className={`flex h-[26px] items-center rounded-full px-2.5 text-[11px] font-extrabold uppercase tracking-wider ${status.className}`}>
                        {status.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <Card title="Invita a tus amigos">
            <div className="flex flex-col items-center gap-2 rounded-[18px] border border-dashed border-linea-fuerte bg-[#0A0E14] p-5">
              <span className="text-xs font-extrabold tracking-[0.12em] text-gris">CÓDIGO DEL GRUPO</span>
              <span className="select-all break-all text-center font-cifras text-[28px] font-bold tracking-[0.12em] text-volt">{grupo.codigo_invitacion}</span>
              <button
                type="button"
                onClick={handleCopiarCodigo}
                className="flex h-11 items-center gap-2 rounded-xl border border-linea-fuerte bg-transparent px-4 font-body text-sm font-bold text-tiza transition-colors hover:border-niebla"
              >
                {copiado ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8FF2E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>
                )}
                <span aria-live="polite">{copiado ? '¡Copiado!' : 'Copiar código'}</span>
              </button>
            </div>

            {miRol === 'admin' ? (
              <>
                <a
                  href={linkWhatsApp || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!linkWhatsApp}
                  className={`flex h-14 items-center justify-center gap-2.5 rounded-[14px] bg-[#25D366] text-base font-extrabold text-[#06240F] no-underline transition-opacity hover:opacity-90 ${linkWhatsApp ? '' : 'pointer-events-none opacity-60'}`}
                >
                  <WhatsAppIcon />Invitar por WhatsApp
                </a>
                <p className="text-[13px] leading-relaxed text-gris">Se abre WhatsApp con un mensaje listo que incluye el nombre y el código del grupo.</p>
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-gris">Comparte este código con tus amigos para que se unan desde la página de Grupos.</p>
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}
