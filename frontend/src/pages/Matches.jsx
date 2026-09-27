import { useState, useEffect } from 'react'
import axios from 'axios'
import Crest from '../components/Crest'
import { ODDS, formatMoney } from '../utils/futbol'

const QUICK_AMOUNTS = [10, 25, 50, 100]
const MAX_BET = 100000

const PICKS = [
  { value: '1', label: 'Local' },
  { value: 'X', label: 'Empate' },
  { value: '2', label: 'Visita' }
]

const formatHour = (fecha) =>
  new Date(fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })

// "Hoy", "Mañana" o "Sábado 27 de septiembre"
const dayLabel = (fecha) => {
  const date = new Date(fecha)
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  if (date.toDateString() === new Date().toDateString()) return 'Hoy'
  if (date.toDateString() === manana.toDateString()) return 'Mañana'
  const label = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Agrupa los partidos (ya ordenados por fecha) por día
const groupByDay = (matches) => {
  const groups = []
  matches.forEach(match => {
    const key = new Date(match.fecha).toDateString()
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.matches.push(match)
    else groups.push({ key, label: dayLabel(match.fecha), matches: [match] })
  })
  return groups
}

function MatchCardSkeleton() {
  return <div className="h-[244px] animate-pulse rounded-3xl border border-linea bg-grada" aria-hidden="true" />
}

function MatchCard({ match, onPick }) {
  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-linea bg-grada p-5 transition-colors hover:border-linea-fuerte">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold tracking-wider text-gris">PRIMERA DIVISIÓN</span>
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-pasto px-3 font-cifras text-[13px] font-bold text-niebla">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          {formatHour(match.fecha)}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex flex-col items-center gap-2 text-center">
          <Crest name={match.equipo_local} className="h-14 w-14 border-2 border-linea-fuerte text-lg" />
          <span className="text-sm font-extrabold leading-tight">{match.equipo_local}</span>
        </div>
        <span className="px-1 font-display text-3xl italic text-linea-fuerte">VS</span>
        <div className="flex flex-col items-center gap-2 text-center">
          <Crest name={match.equipo_visitante} className="h-14 w-14 border-2 border-linea-fuerte text-lg" />
          <span className="text-sm font-extrabold leading-tight">{match.equipo_visitante}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label={`Apostar en ${match.equipo_local} vs ${match.equipo_visitante}`}>
        {PICKS.map(pick => (
          <button
            key={pick.value}
            type="button"
            onClick={() => onPick(match, pick.value)}
            aria-label={`${pick.label}: cuota ${ODDS[pick.value].toFixed(2)}`}
            className="group flex h-14 flex-col items-center justify-center rounded-[14px] border border-[#2A3545] bg-pasto transition-colors hover:border-volt focus-visible:border-volt focus-visible:outline-none"
          >
            <span className="text-[11px] font-bold text-gris group-hover:text-niebla">{pick.value} · {pick.label}</span>
            <span className="font-cifras text-base font-bold">{ODDS[pick.value].toFixed(2)}</span>
          </button>
        ))}
      </div>
    </article>
  )
}

export default function Matches({ token, user, onUserUpdate }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [betAmount, setBetAmount] = useState('')
  const [prediction, setPrediction] = useState('1')
  const [betError, setBetError] = useState('')
  const [bettingLoading, setBettingLoading] = useState(false)
  const userSaldo = parseFloat(user?.saldo) || 0

  useEffect(() => {
    axios.get('http://localhost:5000/api/matches')
      .then(response => setMatches(response.data.filter(m => m.estado === 'pendiente')))
      .catch(() => setError('Error al cargar los partidos'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(''), 5000)
    return () => clearTimeout(timer)
  }, [success])

  useEffect(() => {
    if (!selectedMatch) return
    const onKeyDown = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [selectedMatch])

  const openModal = (match, pick = '1') => {
    setSelectedMatch(match)
    setPrediction(pick)
    setBetAmount('')
    setBetError('')
  }

  const closeModal = () => {
    setSelectedMatch(null)
    setBetError('')
  }

  const monto = parseFloat(betAmount)
  const amountError =
    !betAmount ? '' :
    isNaN(monto) || monto <= 0 ? 'El monto debe ser mayor a 0' :
    monto > userSaldo ? `Saldo insuficiente. Tienes ${formatMoney(userSaldo)}.` :
    monto > MAX_BET ? `El monto máximo por apuesta es ${formatMoney(MAX_BET)}` : ''
  const canSubmit = betAmount && !amountError && !bettingLoading
  const payout = !amountError && monto > 0 ? monto * ODDS[prediction] : 0

  const handleBet = async () => {
    if (!canSubmit) return
    setBetError('')
    setBettingLoading(true)
    try {
      const response = await axios.post(
        'http://localhost:5000/api/bets',
        { partido_id: selectedMatch.id, monto, prediccion: prediction },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      onUserUpdate({ ...user, saldo: response.data.saldo })
      setSuccess(`¡Apuesta de ${formatMoney(monto)} realizada en ${selectedMatch.equipo_local} vs ${selectedMatch.equipo_visitante}!`)
      closeModal()
    } catch (err) {
      setBetError(err.response?.data?.error || 'Error al apostar')
    } finally {
      setBettingLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-noche" />
  }

  const pickOptions = selectedMatch && [
    { value: '1', label: 'Local', team: selectedMatch.equipo_local },
    { value: 'X', label: 'Empate', team: 'Empate' },
    { value: '2', label: 'Visita', team: selectedMatch.equipo_visitante }
  ]

  return (
    <div className="min-h-screen bg-noche font-body text-tiza">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-9 px-4 pb-20 pt-10 sm:px-8 lg:pt-14 xl:px-12 2xl:px-20">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold tracking-[0.15em] text-gris">PRIMERA DIVISIÓN DE CHILE</span>
            <h1 className="font-display text-5xl uppercase italic leading-[0.9] sm:text-7xl">Partidos</h1>
          </div>
          <p className="max-w-sm text-[15px] text-niebla">Toca una cuota para apostar. Solo puedes apostar antes de que empiece el partido.</p>
        </header>

        {error && (
          <div role="alert" className="rounded-[14px] border border-roja-borde bg-roja-suave px-4 py-3.5 text-sm font-semibold text-roja">{error}</div>
        )}

        {success && (
          <div role="status" className="flex items-center justify-between gap-4 rounded-[14px] border border-[#4A6417] bg-volt-suave px-4 py-3.5 text-sm font-semibold text-volt">
            <span className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
              {success}
            </span>
            <button type="button" onClick={() => setSuccess('')} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-volt hover:bg-[#26330C]" aria-label="Cerrar aviso">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map(i => <MatchCardSkeleton key={i} />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-linea-fuerte px-6 py-16 text-center">
            <h2 className="font-display text-3xl uppercase italic">Sin partidos por ahora</h2>
            <p className="text-niebla">Vuelve pronto: publicaremos la próxima fecha apenas esté confirmada.</p>
          </div>
        ) : (
          groupByDay(matches).map(group => (
            <section key={group.key} className="flex flex-col gap-4" aria-label={group.label}>
              <h2 className="flex items-center gap-3 text-sm font-extrabold uppercase tracking-[0.12em] text-niebla">
                {group.label}
                <span className="h-px flex-1 bg-linea" aria-hidden="true" />
                <span className="font-cifras text-xs text-gris">{group.matches.length} {group.matches.length === 1 ? 'partido' : 'partidos'}</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.matches.map(match => <MatchCard key={match.id} match={match} onPick={openModal} />)}
              </div>
            </section>
          ))
        )}
      </div>

      {selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bet-modal-title"
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-[#2A3545] bg-grada p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl shadow-black/60 sm:rounded-[28px] sm:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded bg-linea-fuerte sm:hidden" aria-hidden="true" />

            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 id="bet-modal-title" className="font-display text-3xl uppercase italic leading-none">Tu apuesta</h2>
                <p className="text-sm text-niebla">
                  {selectedMatch.equipo_local} vs {selectedMatch.equipo_visitante} · {dayLabel(selectedMatch.fecha)}, {formatHour(selectedMatch.fecha)}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2A3545] text-niebla hover:border-linea-fuerte hover:text-tiza" aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <p className="mb-2 text-[13px] font-bold text-niebla">Pronóstico</p>
            <div className="mb-6 grid grid-cols-3 gap-2" role="group" aria-label="Pronóstico">
              {pickOptions.map(opt => {
                const active = prediction === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrediction(opt.value)}
                    aria-pressed={active}
                    className={`flex h-[68px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 transition-colors ${
                      active ? 'border-2 border-volt bg-volt text-noche' : 'border border-[#2A3545] bg-pasto text-tiza hover:border-volt'
                    }`}
                  >
                    <span className={`w-full truncate text-xs ${active ? 'font-extrabold' : 'font-bold text-gris'}`}>{opt.value} · {opt.team}</span>
                    <span className="font-cifras text-xl font-bold">{ODDS[opt.value].toFixed(2)}</span>
                  </button>
                )
              })}
            </div>

            <label htmlFor="bet-amount" className="mb-2 block text-[13px] font-bold text-niebla">Monto a apostar</label>
            <div className="relative mb-3">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-cifras text-lg font-bold text-gris">$</span>
              <input
                id="bet-amount"
                type="number"
                inputMode="decimal"
                min="1"
                max={MAX_BET}
                autoFocus
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleBet() }}
                placeholder="0"
                aria-invalid={amountError ? true : undefined}
                aria-describedby={amountError ? 'bet-amount-error' : undefined}
                className={`h-14 w-full rounded-[14px] border bg-[#0A0E14] pl-9 pr-4 font-cifras text-xl font-bold text-tiza outline-none placeholder:text-gris/60 focus:ring-[3px] ${
                  amountError ? 'border-[#FF5C6C] focus:ring-roja-suave' : 'border-[#2A3545] focus:border-volt focus:ring-[#26330C]'
                }`}
              />
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {QUICK_AMOUNTS.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBetAmount(String(v))}
                  disabled={v > userSaldo}
                  className={`h-9 rounded-full border px-3.5 font-cifras text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    monto === v ? 'border-volt bg-volt-suave text-volt' : 'border-[#2A3545] text-tiza hover:border-linea-fuerte'
                  }`}
                >
                  {formatMoney(v)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBetAmount(String(Math.min(userSaldo, MAX_BET)))}
                disabled={userSaldo <= 0}
                className="h-9 rounded-full border border-[#2A3545] px-3.5 text-[13px] font-bold text-tiza transition-colors hover:border-linea-fuerte disabled:cursor-not-allowed disabled:opacity-40"
              >
                Todo
              </button>
              <span className="ml-auto text-xs text-gris">Saldo: <span className="font-cifras font-bold text-niebla">{formatMoney(userSaldo)}</span></span>
            </div>

            {amountError && <p id="bet-amount-error" className="mb-4 text-sm font-semibold text-roja">{amountError}</p>}

            <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#1E2735] bg-[#0A0E14] px-4 py-3.5">
              <span className="text-[13px] font-bold text-gris">Ganancia potencial</span>
              <span className="font-cifras text-xl font-bold text-volt">{formatMoney(payout)}</span>
            </div>

            {betError && (
              <div role="alert" className="mb-4 rounded-[14px] border border-roja-borde bg-roja-suave px-4 py-3 text-sm font-semibold text-roja">{betError}</div>
            )}

            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="h-[52px] rounded-[14px] border border-[#2A3545] px-5 font-bold text-tiza hover:border-linea-fuerte"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBet}
                disabled={!canSubmit}
                className="h-[52px] rounded-[14px] bg-volt px-4 font-extrabold text-noche transition-colors hover:bg-[#D8FF6A] disabled:cursor-not-allowed disabled:bg-pasto-alto disabled:text-gris"
              >
                {bettingLoading ? 'Apostando...' : canSubmit ? `Apostar ${formatMoney(monto)}` : 'Confirmar apuesta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
