import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Crest from '../components/Crest'
import { ODDS, SALDO_INICIAL, formatMoney, formatKickoff } from '../utils/futbol'
import { API_URL } from '../utils/api'

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'ganada', label: 'Ganadas' },
  { id: 'perdida', label: 'Perdidas' }
]

const STATUS = {
  pendiente: { label: 'Pendiente', badge: 'bg-ambar-suave text-ambar', result: 'text-niebla' },
  ganada: { label: 'Ganada', badge: 'bg-volt-suave text-volt', result: 'text-volt' },
  perdida: { label: 'Perdida', badge: 'bg-roja-suave text-roja', result: 'text-roja' },
  anulada: { label: 'Anulada', badge: 'bg-pasto-alto text-niebla', result: 'text-niebla' }
}

// Columnas de la tabla en escritorio: partido, pronóstico, monto, cuota, resultado, estado
const ROW_COLS = 'lg:grid-cols-[minmax(0,1fr)_104px_72px_56px_100px_96px]'

const formatSigned = (value) => `${value < 0 ? '−' : '+'}${formatMoney(value)}`

// Cuota guardada al apostar; las apuestas antiguas usan la cuota fija del pronóstico
const betOdds = (bet) => parseFloat(bet.cuota) || ODDS[bet.prediccion] || ODDS['1']

// Ganancia neta de una apuesta cerrada: la calcula el servidor al liquidar
const betProfit = (bet) => {
  const monto = parseFloat(bet.monto)
  if (bet.ganancia != null) return parseFloat(bet.ganancia)
  if (bet.estado === 'perdida') return -monto
  if (bet.estado === 'ganada') return monto * (betOdds(bet) - 1)
  return 0
}

const matchInfo = (bet) => {
  if (bet.estado !== 'pendiente' && bet.goles_local != null && bet.goles_visitante != null) {
    return `Final ${bet.goles_local}–${bet.goles_visitante}`
  }
  return bet.fecha_partido ? formatKickoff(bet.fecha_partido) : ''
}

function StatusBadge({ estado }) {
  const status = STATUS[estado]
  if (!status) return <span className="text-xs text-gris">{estado}</span>
  return (
    <span className={`inline-flex h-7 items-center rounded-full px-3 text-[11px] font-extrabold uppercase tracking-wider ${status.badge}`}>
      {status.label}
    </span>
  )
}

function StatCard({ label, value, hint, accent = false, valueClass = '', children }) {
  return (
    <div className={`flex flex-col gap-2.5 rounded-3xl p-6 ${accent ? 'bg-volt text-noche' : 'border border-linea bg-grada'}`}>
      <span className={`text-[13px] font-extrabold uppercase tracking-wider ${accent ? '' : 'text-gris'}`}>{label}</span>
      <span className={`font-cifras text-4xl font-bold tracking-tight xl:text-[44px] ${valueClass}`}>{value}</span>
      {hint && <span className={`text-[13px] ${accent ? 'font-bold' : 'text-gris'}`}>{hint}</span>}
      {children}
    </div>
  )
}

function BetRow({ bet }) {
  const status = STATUS[bet.estado] ?? STATUS.pendiente
  const odds = betOdds(bet)
  const monto = parseFloat(bet.monto)
  const pending = bet.estado === 'pendiente'
  const result = pending ? formatMoney(monto * odds)
    : bet.estado === 'anulada' ? `${formatMoney(monto)} devuelto`
    : formatSigned(betProfit(bet))

  return (
    <article className={`flex flex-col gap-3 rounded-2xl bg-pasto p-4 lg:grid lg:min-h-[76px] ${ROW_COLS} lg:items-center lg:gap-3 lg:px-4 lg:py-3`}>
      <div className="flex items-start justify-between gap-3 lg:contents">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex">
            <Crest name={bet.equipo_local} className="h-[34px] w-[34px] border-2 border-pasto text-xs" />
            <Crest name={bet.equipo_visitante} className="-ml-2 h-[34px] w-[34px] border-2 border-pasto text-xs" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[15px] font-extrabold leading-snug lg:line-clamp-2">{bet.equipo_local} vs {bet.equipo_visitante}</span>
            <span className="text-[13px] text-gris">{matchInfo(bet)}</span>
          </div>
        </div>
        <div className="shrink-0 lg:order-last lg:justify-self-end">
          <StatusBadge estado={bet.estado} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-linea pt-3 font-cifras text-sm lg:contents">
        <span className="flex items-center gap-2 lg:justify-self-start">
          <span className="flex h-8 min-w-9 items-center justify-center rounded-[10px] border border-linea-fuerte px-2.5 font-bold" title="Pronóstico">
            {bet.prediccion}
          </span>
          <span className="text-niebla lg:hidden">{formatMoney(monto)} @ {odds.toFixed(2)}</span>
        </span>
        <span className="hidden text-[15px] font-bold lg:block">{formatMoney(monto)}</span>
        <span className="hidden text-[15px] text-niebla lg:block">{odds.toFixed(2)}</span>
        <span className={`flex flex-col text-[15px] font-bold ${status.result}`}>
          {pending && <span className="font-body text-[11px] font-semibold text-gris">posible</span>}
          {result}
        </span>
      </div>
    </article>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse rounded-3xl bg-grada" />)}
      </div>
      {[0, 1, 2].map(i => <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-grada" />)}
    </div>
  )
}

export default function MyBets({ token, user }) {
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('todas')

  useEffect(() => {
    fetchBets()
  }, [])

  const fetchBets = async () => {
    try {
      const response = await axios.get(`${API_URL}/bets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBets(response.data)
    } catch (err) {
      setError('Error al cargar las apuestas')
    } finally {
      setLoading(false)
    }
  }

  const settled = bets.filter(b => b.estado === 'ganada' || b.estado === 'perdida')
  const won = settled.filter(b => b.estado === 'ganada').length
  const hitRate = settled.length ? Math.round((won / settled.length) * 100) : null
  const totalStaked = bets.reduce((sum, b) => sum + parseFloat(b.monto), 0)
  const netProfit = settled.reduce((sum, b) => sum + betProfit(b), 0)
  const streak = settled.slice(0, 5)
  const byPick = ['1', 'X', '2'].map(pick => ({ pick, count: bets.filter(b => b.prediccion === pick).length }))
  const maxPick = Math.max(1, ...byPick.map(p => p.count))
  const visibleBets = filter === 'todas' ? bets : bets.filter(b => b.estado === filter)
  const countFor = (id) => (id === 'todas' ? bets.length : bets.filter(b => b.estado === id).length)

  return (
    <div className="min-h-screen bg-noche font-body text-tiza">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-9 px-4 pb-20 pt-10 sm:px-8 lg:pt-14 xl:px-12 2xl:px-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold tracking-[0.15em] text-gris">TU HISTORIAL</span>
            <h1 className="font-display text-5xl uppercase italic leading-[0.9] sm:text-7xl">Mis apuestas</h1>
          </div>
          <Link
            to="/matches"
            className="flex h-[52px] items-center gap-2.5 rounded-[14px] bg-volt px-6 text-[15px] font-extrabold text-noche no-underline transition-colors hover:bg-[#D8FF6A]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Nueva apuesta
          </Link>
        </div>

        {error && (
          <div role="alert" className="rounded-[14px] border border-roja-borde bg-roja-suave px-4 py-3.5 text-sm font-semibold text-roja">
            {error}
          </div>
        )}

        {loading ? (
          <Skeleton />
        ) : bets.length === 0 && !error ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-linea-fuerte px-6 py-16 text-center">
            <h2 className="font-display text-4xl uppercase italic">Aún no apuestas</h2>
            <p className="max-w-md text-niebla">Tienes {formatMoney(user?.saldo ?? SALDO_INICIAL)} de saldo virtual esperando. Elige un partido y haz tu primer pronóstico.</p>
            <Link to="/matches" className="flex h-[52px] items-center rounded-[14px] bg-volt px-6 font-extrabold text-noche no-underline">
              Ir a los partidos
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard
                accent
                label="Saldo actual"
                value={user ? formatMoney(user.saldo) : '—'}
                hint={`Empezaste con ${formatMoney(SALDO_INICIAL)}`}
              />
              <StatCard
                label="Total apostado"
                value={formatMoney(totalStaked)}
                hint={`en ${bets.length} ${bets.length === 1 ? 'apuesta' : 'apuestas'}`}
              />
              <StatCard
                label="Ganancia neta"
                value={settled.length ? formatSigned(netProfit) : '—'}
                valueClass={settled.length ? (netProfit < 0 ? 'text-roja' : 'text-volt') : ''}
                hint="de las apuestas cerradas"
              />
              <StatCard label="Acierto" value={hitRate === null ? '—' : `${hitRate}%`}>
                <div className="flex h-1.5 overflow-hidden rounded bg-linea-fuerte" aria-hidden="true">
                  <span className="rounded bg-volt" style={{ width: `${hitRate ?? 0}%` }} />
                </div>
              </StatCard>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-grada p-4 sm:p-6" aria-label="Listado de apuestas">
                <div className="flex gap-1 self-stretch overflow-x-auto rounded-2xl [scrollbar-width:none] sm:gap-1.5 border border-[#1E2735] bg-[#0A0E14] p-1.5 sm:self-start" role="group" aria-label="Filtrar apuestas">
                  {FILTERS.map(f => {
                    const active = filter === f.id
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter(f.id)}
                        className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-1.5 font-body text-xs font-extrabold sm:flex-none sm:px-4 sm:text-sm transition-colors ${active ? 'bg-tiza text-noche' : 'bg-transparent text-niebla hover:bg-pasto'}`}
                      >
                        {f.label}
                        <span className="hidden font-cifras text-xs opacity-70 sm:inline">{countFor(f.id)}</span>
                      </button>
                    )
                  })}
                </div>

                <div className={`hidden ${ROW_COLS} gap-3 px-4 py-2 text-xs font-extrabold tracking-wider text-gris lg:grid`}>
                  <span>PARTIDO</span><span>PRONÓSTICO</span><span>MONTO</span><span>CUOTA</span><span>RESULTADO</span><span className="text-right">ESTADO</span>
                </div>

                {visibleBets.length === 0 ? (
                  <p className="px-4 py-10 text-center text-niebla">No tienes apuestas {FILTERS.find(f => f.id === filter)?.label.toLowerCase()}.</p>
                ) : (
                  visibleBets.map(bet => <BetRow key={bet.id} bet={bet} />)
                )}
              </section>

              <aside className="grid grid-cols-1 items-start gap-4 md:grid-cols-3 xl:grid-cols-1">
                <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-grada p-6">
                  <h2 className="text-[13px] font-extrabold tracking-[0.15em] text-gris">RACHA RECIENTE</h2>
                  {streak.length === 0 ? (
                    <p className="text-sm text-niebla">Aparecerá cuando se cierre tu primera apuesta.</p>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        {streak.map(b => (
                          <span
                            key={b.id}
                            title={`${b.equipo_local} vs ${b.equipo_visitante}: ${STATUS[b.estado].label}`}
                            className={`flex h-[52px] w-[52px] items-center justify-center rounded-[14px] font-display text-2xl italic ${b.estado === 'ganada' ? 'bg-volt text-noche' : 'border border-roja-borde bg-roja-suave text-roja'}`}
                          >
                            {b.estado === 'ganada' ? 'G' : 'P'}
                          </span>
                        ))}
                      </div>
                      <p className="text-[13px] text-gris">De la más reciente a la más antigua. G = ganada, P = perdida.</p>
                    </>
                  )}
                </section>

                <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-grada p-6">
                  <h2 className="text-[13px] font-extrabold tracking-[0.15em] text-gris">¿QUÉ PRONOSTICAS MÁS?</h2>
                  {byPick.map(({ pick, count }) => (
                    <div key={pick} className="flex items-center gap-3">
                      <span className="w-7 font-cifras font-bold">{pick}</span>
                      <div className="flex h-3 flex-1 rounded-md bg-pasto-alto">
                        <span className="rounded-md bg-volt" style={{ width: `${(count / maxPick) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right font-cifras text-sm text-niebla">{count}</span>
                    </div>
                  ))}
                </section>

                <section className="flex flex-col gap-3 rounded-3xl border border-dashed border-linea-fuerte p-6">
                  <h2 className="font-display text-[28px] uppercase italic leading-none">Llévalo a tu grupo</h2>
                  <p className="text-sm leading-relaxed text-niebla">Compite con tus amigos y mira quién sabe más de fútbol.</p>
                  <Link to="/grupos" className="text-sm font-extrabold text-volt no-underline hover:text-[#E2FF8A]">
                    Ver mis grupos →
                  </Link>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
