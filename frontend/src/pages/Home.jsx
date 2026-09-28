import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Crest from '../components/Crest'
import { ODDS, SALDO_INICIAL, formatMoney, formatKickoff } from '../utils/futbol'
import { groupInitials, groupTile } from '../utils/grupos'
import { API_URL } from '../utils/api'

const QUICK_AMOUNTS = [10, 25, 50, 100]

const firstName = (name = '') => name.split(/\s+/)[0] || name

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
  )
}

// Líneas de cancha decorativas detrás del hero
function PitchLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 620" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
      <g stroke="#C8FF2E" strokeOpacity="0.07" strokeWidth="2">
        <circle cx="720" cy="310" r="150" />
        <line x1="720" y1="0" x2="720" y2="620" />
        <rect x="-2" y="150" width="200" height="320" />
        <rect x="1242" y="150" width="200" height="320" />
      </g>
    </svg>
  )
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {eyebrow && <span className="text-xs font-extrabold tracking-[0.15em] text-gris">{eyebrow}</span>}
        <h2 className="font-display text-4xl uppercase italic leading-none sm:text-5xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}

// Partido destacado con cupón de apuesta (o invitación a registrarse)
function FeaturedMatch({ match, user, token, onUserUpdate, onBetPlaced }) {
  const [pick, setPick] = useState('1')
  const [amount, setAmount] = useState(50)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const saldo = parseFloat(user?.saldo) || 0
  const payout = amount * ODDS[pick]
  const pickTarget = pick === '1' ? `a ${match.equipo_local}` : pick === '2' ? `a ${match.equipo_visitante}` : 'al empate'
  const insufficient = user && amount > saldo

  const picks = [
    { value: '1', label: '1 · Local' },
    { value: 'X', label: 'X · Empate' },
    { value: '2', label: '2 · Visita' }
  ]

  const placeBet = async () => {
    if (insufficient || loading) return
    setLoading(true)
    setMessage(null)
    try {
      const response = await axios.post(
        `${API_URL}/bets`,
        { partido_id: match.id, monto: amount, prediccion: pick },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onUserUpdate({ ...user, saldo: response.data.saldo })
      setMessage({ tone: 'ok', text: `¡Listo! Apostaste ${formatMoney(amount)} ${pickTarget}.` })
      onBetPlaced()
    } catch (err) {
      setMessage({ tone: 'error', text: err.response?.data?.error || 'No se pudo realizar la apuesta' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className="relative flex flex-col gap-6 rounded-[28px] border border-linea bg-grada p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-xl italic tracking-wide text-volt">PARTIDO DESTACADO</span>
        <span className="flex items-center gap-2 text-[13px] font-bold text-niebla">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {formatKickoff(match.fecha)}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex flex-col items-center gap-3 text-center">
          <Crest name={match.equipo_local} className="h-16 w-16 border-[3px] border-linea-fuerte text-2xl sm:h-[84px] sm:w-[84px] sm:text-[32px]" />
          <span className="text-[15px] font-extrabold leading-tight sm:text-base">{match.equipo_local}</span>
          <span className="text-xs text-gris">Local</span>
        </div>
        <span className="px-2 font-display text-4xl italic text-linea-fuerte sm:text-[56px]">VS</span>
        <div className="flex flex-col items-center gap-3 text-center">
          <Crest name={match.equipo_visitante} className="h-16 w-16 border-[3px] border-linea-fuerte text-2xl sm:h-[84px] sm:w-[84px] sm:text-[32px]" />
          <span className="text-[15px] font-extrabold leading-tight sm:text-base">{match.equipo_visitante}</span>
          <span className="text-xs text-gris">Visita</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Elige tu pronóstico">
        {picks.map(p => {
          const active = pick === p.value
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={active}
              onClick={() => setPick(p.value)}
              className={`flex h-[72px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 font-body transition-colors ${
                active ? 'border-2 border-volt bg-volt text-noche' : 'border border-[#2A3545] bg-pasto text-tiza hover:border-volt'
              }`}
            >
              <span className={`w-full truncate text-xs ${active ? 'font-extrabold' : 'font-bold text-gris'}`}>{p.label}</span>
              <span className="font-cifras text-[22px] font-bold">{ODDS[p.value].toFixed(2)}</span>
            </button>
          )
        })}
      </div>

      {user ? (
        <div className="flex flex-col gap-3.5 rounded-[18px] border border-[#1E2735] bg-[#0A0E14] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-bold text-gris">Monto</span>
            <div className="flex gap-1.5" role="group" aria-label="Monto de la apuesta">
              {QUICK_AMOUNTS.map(value => {
                const active = amount === value
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setAmount(value)}
                    className={`h-9 rounded-full px-3.5 font-cifras text-[13px] font-bold transition-colors ${
                      active ? 'border border-volt bg-volt-suave text-volt' : 'border border-[#2A3545] bg-transparent text-tiza hover:border-linea-fuerte'
                    }`}
                  >
                    {formatMoney(value)}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-gris">Ganancia potencial</span>
            <span className="font-cifras text-xl font-bold text-volt">{formatMoney(payout)}</span>
          </div>
          {message && (
            <p role={message.tone === 'error' ? 'alert' : 'status'} className={`text-sm font-semibold ${message.tone === 'error' ? 'text-roja' : 'text-volt'}`}>
              {message.text}
            </p>
          )}
          {insufficient && !message && (
            <p className="text-sm font-semibold text-roja">Saldo insuficiente. Tienes {formatMoney(saldo)}.</p>
          )}
          <button
            type="button"
            onClick={placeBet}
            disabled={insufficient || loading}
            className="h-[52px] rounded-[14px] bg-tiza px-4 font-body text-[15px] font-extrabold text-noche transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-pasto-alto disabled:text-gris"
          >
            {loading ? 'Apostando...' : `Apostar ${formatMoney(amount)} ${pickTarget}`}
          </button>
        </div>
      ) : (
        <Link
          to="/register"
          className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-tiza font-extrabold text-noche no-underline transition-colors hover:bg-white"
        >
          Regístrate para apostar <Arrow />
        </Link>
      )}
    </article>
  )
}

function FeaturedSkeleton() {
  return <div className="h-[520px] animate-pulse rounded-[28px] border border-linea bg-grada" aria-hidden="true" />
}

function MatchCard({ match, to }) {
  return (
    <article className="flex flex-col gap-4 rounded-[20px] border border-linea bg-grada p-5">
      <span className="text-xs font-extrabold uppercase tracking-wider text-gris">{formatKickoff(match.fecha)}</span>
      <div className="flex flex-col gap-2.5">
        {[match.equipo_local, match.equipo_visitante].map(team => (
          <div key={team} className="flex items-center gap-3">
            <Crest name={team} className="h-8 w-8 text-[13px]" />
            <span className="text-[15px] font-bold">{team}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {['1', 'X', '2'].map(p => (
          <Link
            key={p}
            to={to}
            className="flex h-12 flex-col items-center justify-center rounded-xl border border-[#2A3545] bg-pasto text-tiza no-underline transition-colors hover:border-volt"
            aria-label={`Pronóstico ${p}, cuota ${ODDS[p].toFixed(2)}`}
          >
            <span className="text-[11px] font-bold text-gris">{p}</span>
            <span className="font-cifras text-sm font-bold">{ODDS[p].toFixed(2)}</span>
          </Link>
        ))}
      </div>
    </article>
  )
}

const STEPS = [
  { title: 'Regístrate gratis', text: 'Crea tu cuenta y recibe $1.000 de saldo virtual para empezar a jugar.' },
  { title: 'Elige tu pronóstico', text: 'Gana el local (1), empate (X) o gana la visita (2). Mientras más difícil, mejor paga.' },
  { title: 'Compite con tu gente', text: 'Arma un grupo, invita a tus amigos por WhatsApp y mira quién sabe más de fútbol.' }
]

export default function Home({ user, token, onUserUpdate }) {
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [pendingBets, setPendingBets] = useState([])
  const [groups, setGroups] = useState([])

  useEffect(() => {
    axios.get(`${API_URL}/matches`)
      .then(({ data }) => setMatches(data.filter(m => m.estado === 'pendiente')))
      .catch(() => setMatches([]))
      .finally(() => setLoadingMatches(false))
  }, [])

  const loadActivity = useCallback(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    axios.get(`${API_URL}/bets`, { headers })
      .then(({ data }) => setPendingBets(data.filter(b => b.estado === 'pendiente')))
      .catch(() => {})
    axios.get(`${API_URL}/grupos`, { headers })
      .then(({ data }) => setGroups(data))
      .catch(() => {})
  }, [token])

  useEffect(() => { loadActivity() }, [loadActivity])

  const [featured, ...rest] = matches
  const upcoming = rest.slice(0, 4)
  const betLink = user ? '/matches' : '/register'

  return (
    <div className="bg-noche font-body text-tiza">
      <section className="relative overflow-hidden border-b border-[#161E2A]">
        <PitchLines />
        <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-4 py-12 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-[72px] xl:px-20">
          <div className="flex flex-col gap-7">
            <span className="flex h-8 items-center gap-2.5 self-start rounded-full border border-[#2A3545] bg-[#131A24] px-3.5 text-xs font-extrabold tracking-[0.1em] text-volt">
              <span className="h-2 w-2 rounded-full bg-volt" aria-hidden="true" />
              {user ? `HOLA, ${firstName(user.nombre).toUpperCase()}` : 'PRIMERA DIVISIÓN DE CHILE'}
            </span>
            <h1 className="font-display text-[56px] uppercase italic leading-[0.9] tracking-tight sm:text-7xl xl:text-[84px] 2xl:text-[104px]">
              Apuesta al fútbol chileno. <span className="text-volt">Sin arriesgar un peso.</span>
            </h1>
            <p className="max-w-[520px] text-base leading-relaxed text-niebla sm:text-lg">
              {user
                ? `Tienes ${formatMoney(user.saldo)} de saldo virtual. Pronostica 1 · X · 2 en cada partido y compite con tus amigos en grupos privados.`
                : 'Recibe $1.000 de saldo virtual al registrarte, pronostica 1 · X · 2 en cada partido y compite con tus amigos en grupos privados.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={user ? '/matches' : '/register'}
                className="flex h-14 items-center gap-2.5 rounded-[14px] bg-volt px-7 text-base font-extrabold text-noche no-underline transition-colors hover:bg-[#D8FF6A]"
              >
                {user ? 'Ver partidos' : 'Crear cuenta gratis'} <Arrow />
              </Link>
              <Link
                to={user ? '/grupos' : '/login'}
                className="flex h-14 items-center rounded-[14px] border border-linea-fuerte px-6 text-base font-bold text-tiza no-underline transition-colors hover:border-niebla"
              >
                {user ? 'Mis grupos' : 'Ya tengo cuenta'}
              </Link>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-4 pt-2">
              {[
                [formatMoney(SALDO_INICIAL), 'saldo inicial virtual'],
                ['1 · X · 2', 'pronósticos simples'],
                ['$0', 'de dinero real']
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col-reverse gap-1">
                  <dt className="text-[13px] text-gris">{label}</dt>
                  <dd className="font-cifras text-[22px] font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {loadingMatches ? (
            <FeaturedSkeleton />
          ) : featured ? (
            <FeaturedMatch
              key={featured.id}
              match={featured}
              user={user}
              token={token}
              onUserUpdate={onUserUpdate}
              onBetPlaced={loadActivity}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-linea-fuerte px-6 py-16 text-center">
              <h2 className="font-display text-3xl uppercase italic">Sin partidos por ahora</h2>
              <p className="text-niebla">Vuelve pronto: publicaremos la próxima fecha apenas esté confirmada.</p>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-16 px-4 py-14 sm:px-8 xl:px-20">
        {upcoming.length > 0 && (
          <section className="flex flex-col gap-7">
            <SectionTitle
              eyebrow="LO QUE VIENE"
              title="Próximos partidos"
              action={
                <Link to={betLink} className="flex items-center gap-2 text-[15px] font-bold text-volt no-underline hover:text-[#E2FF8A]">
                  Ver todos <Arrow />
                </Link>
              }
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {upcoming.map(m => <MatchCard key={m.id} match={m} to={betLink} />)}
            </div>
          </section>
        )}

        {user ? (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-5 rounded-3xl border border-linea bg-grada p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl uppercase italic">Tus apuestas en juego</h2>
                <Link to="/mis-apuestas" className="text-sm font-bold text-volt no-underline hover:text-[#E2FF8A]">Ver todas</Link>
              </div>
              {pendingBets.length === 0 ? (
                <p className="text-niebla">No tienes apuestas pendientes. Elige un partido y haz tu pronóstico.</p>
              ) : (
                pendingBets.slice(0, 3).map(bet => {
                  const odds = parseFloat(bet.cuota) || ODDS[bet.prediccion] || ODDS['1']
                  const monto = parseFloat(bet.monto)
                  return (
                    <div key={bet.id} className="flex items-center gap-4 rounded-2xl bg-pasto p-4">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-[15px] font-extrabold">{bet.equipo_local} vs {bet.equipo_visitante}</span>
                        <span className="text-[13px] text-gris">
                          Pronóstico <strong className="text-tiza">{bet.prediccion}</strong> · {formatMoney(monto)} a cuota {odds.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="font-cifras text-base font-bold">{formatMoney(monto * odds)}</span>
                        <span className="flex h-6 items-center rounded-full bg-ambar-suave px-2.5 text-[11px] font-extrabold tracking-wider text-ambar">PENDIENTE</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex flex-col gap-5 rounded-3xl border border-linea bg-grada p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-3xl uppercase italic">Tus grupos</h2>
                <Link to="/grupos" className="text-sm font-bold text-volt no-underline hover:text-[#E2FF8A]">Ver grupos</Link>
              </div>
              {groups.length === 0 ? (
                <div className="flex flex-col items-start gap-4">
                  <p className="text-niebla">Todavía no estás en ningún grupo. Crea uno e invita a tus amigos por WhatsApp.</p>
                  <Link to="/grupos" className="flex h-12 items-center rounded-[14px] bg-volt px-5 font-extrabold text-noche no-underline">Crear un grupo</Link>
                </div>
              ) : (
                groups.slice(0, 4).map(g => (
                  <Link key={g.id} to={`/grupos/${g.id}`} className="flex items-center gap-4 rounded-2xl bg-pasto p-4 text-tiza no-underline transition-colors hover:bg-pasto-alto">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] font-display text-lg italic ${groupTile(g.id)}`}>
                      {groupInitials(g.nombre)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-extrabold">{g.nombre}</span>
                      {g.descripcion && <span className="truncate text-[13px] text-gris">{g.descripcion}</span>}
                    </div>
                    <Arrow />
                  </Link>
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-10 rounded-[28px] border border-linea bg-grada p-8 md:grid-cols-3 lg:p-12">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col gap-3">
                <span className="font-display text-7xl italic leading-none text-volt">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="text-xl font-extrabold">{step.title}</h3>
                <p className="text-[15px] leading-relaxed text-niebla">{step.text}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
