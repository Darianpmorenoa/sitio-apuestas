import { useState, useEffect } from 'react'
import axios from 'axios'
import Crest from '../components/Crest'
import { Field, FormAlert } from '../components/AuthLayout'
import { TEAM_NAMES, formatMoney, formatKickoff } from '../utils/futbol'
import { API_URL } from '../utils/api'

const API = `${API_URL}/admin`

const button =
  'flex items-center justify-center rounded-[14px] px-5 font-body text-sm font-extrabold transition-colors disabled:cursor-wait disabled:opacity-70'
const primaryButton = `${button} h-12 bg-volt text-noche hover:bg-[#D8FF6A]`
const ghostButton = `${button} h-12 border border-[#2A3545] bg-transparent text-niebla hover:border-linea-fuerte hover:text-tiza`
const dangerButton = `${button} h-12 border border-roja-borde bg-roja-suave text-roja hover:border-roja`

const inputClass =
  'h-14 w-full max-w-none rounded-[14px] border border-[#2A3545] bg-pasto px-4 font-body text-base text-tiza outline-none transition-colors focus:border-volt focus:ring-[3px] focus:ring-[#26330C] disabled:opacity-60 [color-scheme:dark]'

const plural = (n, singular, pluralText) => `${n} ${n === 1 ? singular : pluralText}`

// "2026-10-04T17:00" en hora local, para el mínimo del campo de fecha
const localInputValue = (date) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date - offset).toISOString().slice(0, 16)
}

const golesValidos = (valor) => /^\d{1,2}$/.test(valor)

const resultadoTexto = (partido, gl, gv) => {
  if (!golesValidos(gl) || !golesValidos(gv)) return 'Ingresa los goles de ambos equipos'
  const l = Number(gl)
  const v = Number(gv)
  if (l === v) return 'Resultado: empate (X)'
  return `Resultado: gana ${l > v ? partido.equipo_local : partido.equipo_visitante} (${l > v ? '1' : '2'})`
}

function SectionTitle({ id, children, count }) {
  return (
    <h2 id={id} className="font-display text-4xl uppercase italic leading-none">
      {children} {count !== undefined && <span className="text-linea-fuerte">{count}</span>}
    </h2>
  )
}

function Apuestas({ partido }) {
  return (
    <span className="text-[13px] font-bold text-niebla">
      {plural(partido.apuestas_pendientes, 'apuesta pendiente', 'apuestas pendientes')}
      {partido.apuestas_pendientes > 0 && <> · <span className="font-cifras text-tiza">{formatMoney(partido.monto_pendiente)}</span></>}
    </span>
  )
}

function GolesInput({ id, label, value, onChange, disabled }) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      maxLength={2}
      autoComplete="off"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      disabled={disabled}
      className="h-16 w-16 max-w-none rounded-2xl border border-[#2A3545] bg-noche text-center font-cifras text-3xl font-bold text-tiza outline-none focus:border-volt focus:ring-[3px] focus:ring-[#26330C] disabled:opacity-60"
    />
  )
}

// Partido ya jugado: se carga el marcador o se suspende. Ambas acciones piden confirmación.
function PorLiquidarCard({ partido, busy, onLiquidar, onAnular }) {
  const [gl, setGl] = useState('')
  const [gv, setGv] = useState('')
  const [confirmar, setConfirmar] = useState(null) // 'liquidar' | 'anular'
  const listo = golesValidos(gl) && golesValidos(gv)

  return (
    <article className="flex flex-col gap-5 rounded-3xl border border-linea bg-grada p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex h-7 items-center rounded-full bg-ambar-suave px-3 text-[11px] font-extrabold uppercase tracking-wider text-ambar">
          Jugado · {formatKickoff(partido.fecha)}
        </span>
        <Apuestas partido={partido} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex flex-col items-center gap-2 text-center">
          <Crest name={partido.equipo_local} className="h-12 w-12 border-2 border-linea-fuerte text-base" />
          <label htmlFor={`gl-${partido.id}`} className="text-sm font-extrabold leading-tight">{partido.equipo_local}</label>
        </div>
        <div className="flex items-center gap-2">
          <GolesInput id={`gl-${partido.id}`} label={`Goles de ${partido.equipo_local}`} value={gl} onChange={setGl} disabled={Boolean(busy || confirmar)} />
          <span className="font-display text-2xl text-linea-fuerte">–</span>
          <GolesInput id={`gv-${partido.id}`} label={`Goles de ${partido.equipo_visitante}`} value={gv} onChange={setGv} disabled={Boolean(busy || confirmar)} />
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <Crest name={partido.equipo_visitante} className="h-12 w-12 border-2 border-linea-fuerte text-base" />
          <label htmlFor={`gv-${partido.id}`} className="text-sm font-extrabold leading-tight">{partido.equipo_visitante}</label>
        </div>
      </div>

      {confirmar ? (
        <div role="alertdialog" aria-label="Confirmar acción" className="flex flex-col gap-3 rounded-2xl border border-linea-fuerte bg-pasto p-4">
          <p className="text-sm text-niebla">
            {confirmar === 'liquidar'
              ? <>¿Confirmas el marcador <strong className="font-cifras text-tiza">{partido.equipo_local} {gl}–{gv} {partido.equipo_visitante}</strong>? Se pagarán las apuestas ganadoras. <strong className="text-tiza">No se puede deshacer.</strong></>
              : <>¿Suspender este partido? Se anulan las apuestas y se devuelve lo apostado. <strong className="text-tiza">No se puede deshacer.</strong></>}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => (confirmar === 'liquidar' ? onLiquidar(partido, gl, gv) : onAnular(partido))}
              className={confirmar === 'liquidar' ? primaryButton : dangerButton}
            >
              {busy ? 'Guardando...' : confirmar === 'liquidar' ? 'Sí, registrar marcador' : 'Sí, suspender'}
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirmar(null)} className={ghostButton}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-gris" aria-live="polite">{resultadoTexto(partido, gl, gv)}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!listo} onClick={() => setConfirmar('liquidar')} className={`${primaryButton} disabled:cursor-not-allowed disabled:opacity-40`}>
              Registrar marcador
            </button>
            <button type="button" onClick={() => setConfirmar('anular')} className={ghostButton}>Suspender</button>
          </div>
        </div>
      )}
    </article>
  )
}

// Fila compacta para próximos partidos e historial
function PartidoRow({ partido, children }) {
  return (
    <li className="flex flex-col gap-3 border-b border-linea px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-5">
      <span className="w-40 shrink-0 font-cifras text-[13px] font-bold text-gris">{formatKickoff(partido.fecha)}</span>
      {/* Local | VS o marcador | visita: los nombres largos pasan a una segunda línea en vez de cortarse */}
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm font-extrabold leading-tight">
        <div className="flex min-w-0 items-center gap-2">
          <Crest name={partido.equipo_local} className="h-7 w-7 text-[10px]" />
          <span className="break-words">{partido.equipo_local}</span>
        </div>
        <span className="whitespace-nowrap px-1 font-display text-lg italic text-linea-fuerte">
          {partido.estado === 'finalizado' ? <span className="font-cifras not-italic text-tiza">{partido.goles_local}–{partido.goles_visitante}</span> : 'VS'}
        </span>
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <span className="break-words">{partido.equipo_visitante}</span>
          <Crest name={partido.equipo_visitante} className="h-7 w-7 text-[10px]" />
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">{children}</div>
    </li>
  )
}

function ProximoRow({ partido, busy, onAnular }) {
  const [confirmar, setConfirmar] = useState(false)
  return (
    <PartidoRow partido={partido}>
      <Apuestas partido={partido} />
      {confirmar ? (
        <>
          <button type="button" disabled={busy} onClick={() => onAnular(partido)} className={`${dangerButton} h-10`}>
            {busy ? 'Guardando...' : 'Sí, suspender'}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirmar(false)} className={`${ghostButton} h-10`}>Cancelar</button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirmar(true)} className={`${ghostButton} h-10`}>Suspender</button>
      )}
    </PartidoRow>
  )
}

function NuevoPartidoForm({ headers, onCreado }) {
  const vacio = { equipoLocal: '', equipoVisitante: '', fecha: '' }
  const [form, setForm] = useState(vacio)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const nuevos = {}
    if (!form.equipoLocal) nuevos.equipoLocal = 'Elige el equipo local'
    if (!form.equipoVisitante) nuevos.equipoVisitante = 'Elige el equipo visitante'
    else if (form.equipoVisitante === form.equipoLocal) nuevos.equipoVisitante = 'Debe ser distinto al local'
    if (!form.fecha) nuevos.fecha = 'Elige la fecha y hora'
    else if (new Date(form.fecha) <= new Date()) nuevos.fecha = 'La fecha debe ser futura'
    setErrors(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      // La hora se escribe en la zona horaria del navegador y se envía en UTC
      const { data } = await axios.post(`${API}/partidos`, { ...form, fecha: new Date(form.fecha).toISOString() }, { headers })
      setForm(vacio)
      onCreado(data)
    } catch (err) {
      setServerError(err.response?.data?.error || 'Error al crear el partido')
    } finally {
      setEnviando(false)
    }
  }

  const select = (campo, label) => (
    <Field id={`nuevo-${campo}`} label={label} error={errors[campo]}>
      <select
        id={`nuevo-${campo}`}
        value={form[campo]}
        onChange={cambiar(campo)}
        disabled={enviando}
        aria-invalid={errors[campo] ? true : undefined}
        aria-describedby={errors[campo] ? `nuevo-${campo}-error` : undefined}
        className={`${inputClass} ${errors[campo] ? 'border-[#FF5C6C]' : ''}`}
      >
        <option value="">Elegir equipo</option>
        {TEAM_NAMES.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
      </select>
    </Field>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-3xl border border-linea bg-grada p-6 sm:p-7">
      {serverError && <FormAlert>{serverError}</FormAlert>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {select('equipoLocal', 'Local')}
        {select('equipoVisitante', 'Visita')}
        <Field id="nuevo-fecha" label="Fecha y hora (hora de Chile)" error={errors.fecha}>
          <input
            id="nuevo-fecha"
            type="datetime-local"
            min={localInputValue(new Date())}
            value={form.fecha}
            onChange={cambiar('fecha')}
            disabled={enviando}
            aria-invalid={errors.fecha ? true : undefined}
            aria-describedby={errors.fecha ? 'nuevo-fecha-error' : undefined}
            className={`${inputClass} ${errors.fecha ? 'border-[#FF5C6C]' : ''}`}
          />
        </Field>
      </div>
      <button type="submit" disabled={enviando} className={`${primaryButton} h-[52px] self-start px-6 text-[15px]`}>
        {enviando ? 'Creando...' : 'Crear partido'}
      </button>
    </form>
  )
}

export default function Admin({ token, onUserUpdate }) {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [ocupado, setOcupado] = useState(null) // id del partido que se está guardando

  const headers = { Authorization: `Bearer ${token}` }

  const cargar = async () => {
    try {
      const { data } = await axios.get(`${API}/partidos`, { headers })
      setPartidos(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los partidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // Si el administrador también apostó, su saldo pudo cambiar
  const refrescarUsuario = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/verify`, { headers })
      onUserUpdate(data.user)
    } catch { /* el saldo se actualizará al recargar */ }
  }

  const ejecutar = async (partido, accion, mensaje) => {
    setError('')
    setExito('')
    setOcupado(partido.id)
    try {
      const { data } = await accion()
      setExito(mensaje(data))
      await Promise.all([cargar(), refrescarUsuario()])
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el cambio')
    } finally {
      setOcupado(null)
    }
  }

  const liquidar = (partido, gl, gv) => ejecutar(
    partido,
    () => axios.post(`${API}/partidos/${partido.id}/liquidar`, { golesLocal: Number(gl), golesVisitante: Number(gv) }, { headers }),
    (r) => `${r.partido}: ${plural(r.ganadas, 'apuesta ganada', 'apuestas ganadas')}, ${plural(r.perdidas, 'perdida', 'perdidas')}. Pagado: ${formatMoney(r.pagado)}.`
  )

  const anular = (partido) => ejecutar(
    partido,
    () => axios.post(`${API}/partidos/${partido.id}/anular`, {}, { headers }),
    (r) => `${r.partido} suspendido: ${plural(r.anuladas, 'apuesta anulada', 'apuestas anuladas')}. Devuelto: ${formatMoney(r.devuelto)}.`
  )

  const porLiquidar = partidos.filter(p => p.por_liquidar)
  const proximos = partidos.filter(p => p.estado === 'pendiente' && !p.por_liquidar)
  const historial = partidos.filter(p => p.estado !== 'pendiente').reverse().slice(0, 10)

  return (
    <div className="min-h-screen bg-noche font-body text-tiza">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 pb-20 pt-10 sm:px-8 lg:pt-14 xl:px-12 2xl:px-20">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold tracking-[0.15em] text-gris">SOLO ADMINISTRADORES</span>
          <h1 className="font-display text-5xl uppercase italic leading-[0.9] sm:text-7xl">Panel</h1>
        </div>

        {error && <FormAlert>{error}</FormAlert>}
        {exito && <FormAlert tone="success">{exito}</FormAlert>}

        <section className="flex flex-col gap-5" aria-labelledby="por-liquidar">
          <div className="flex flex-col gap-1.5">
            <SectionTitle id="por-liquidar" count={loading ? undefined : porLiquidar.length}>Por liquidar</SectionTitle>
            <p className="text-sm text-gris">Partidos que ya empezaron. Registra el marcador final para pagar las apuestas, o suspéndelo para devolver lo apostado.</p>
          </div>
          {loading ? (
            <div className="h-72 animate-pulse rounded-3xl bg-grada" aria-hidden="true" />
          ) : porLiquidar.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-linea-fuerte px-6 py-10 text-center text-niebla">
              No hay partidos pendientes de liquidar.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {porLiquidar.map(p => (
                <PorLiquidarCard key={p.id} partido={p} busy={ocupado === p.id} onLiquidar={liquidar} onAnular={anular} />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-5" aria-labelledby="nuevo-partido">
          <SectionTitle id="nuevo-partido">Nuevo partido</SectionTitle>
          <NuevoPartidoForm
            headers={headers}
            onCreado={(p) => {
              setError('')
              setExito(`Partido creado: ${p.equipo_local} vs ${p.equipo_visitante} (${formatKickoff(p.fecha)}).`)
              cargar()
            }}
          />
        </section>

        <section className="flex flex-col gap-5" aria-labelledby="proximos">
          <SectionTitle id="proximos" count={loading ? undefined : proximos.length}>Próximos</SectionTitle>
          {!loading && (proximos.length === 0 ? (
            <p className="text-niebla">No hay partidos programados. Crea uno arriba.</p>
          ) : (
            <ul className="overflow-hidden rounded-3xl border border-linea bg-grada">
              {proximos.map(p => <ProximoRow key={p.id} partido={p} busy={ocupado === p.id} onAnular={anular} />)}
            </ul>
          ))}
        </section>

        {!loading && historial.length > 0 && (
          <section className="flex flex-col gap-5" aria-labelledby="historial">
            <SectionTitle id="historial">Historial</SectionTitle>
            <ul className="overflow-hidden rounded-3xl border border-linea bg-grada">
              {historial.map(p => (
                <PartidoRow key={p.id} partido={p}>
                  <span className={`flex h-7 items-center rounded-full px-3 text-[11px] font-extrabold uppercase tracking-wider ${p.estado === 'finalizado' ? 'bg-volt-suave text-volt' : 'bg-roja-suave text-roja'}`}>
                    {p.estado === 'finalizado' ? 'Finalizado' : 'Suspendido'}
                  </span>
                  <span className="text-[13px] font-bold text-niebla">{plural(p.total_apuestas, 'apuesta', 'apuestas')}</span>
                </PartidoRow>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
