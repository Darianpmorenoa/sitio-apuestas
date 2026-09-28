import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Crest from '../components/Crest'
import { TEAM_NAMES, formatKickoff } from '../utils/futbol'
import { hasScore, buildTable } from '../utils/tabla'
import { API_URL } from '../utils/api'

const API = `${API_URL}/matches`

const FORM_STYLES = {
  G: 'bg-volt text-noche',
  E: 'bg-linea-fuerte text-tiza',
  P: 'bg-roja-suave text-roja'
}

function StatTile({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-linea bg-grada p-5 sm:p-6">
      <span className="text-[13px] font-extrabold uppercase tracking-wider text-gris">{label}</span>
      <span className="font-cifras text-4xl font-bold tracking-tight sm:text-[44px]">{value}</span>
      {hint && <span className="text-[13px] text-gris">{hint}</span>}
    </div>
  )
}

function Panel({ title, action, children }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-linea bg-grada p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-3xl uppercase italic leading-none">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function Stats() {
  const [played, setPlayed] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([axios.get(`${API}/resultados/historial`), axios.get(API)])
      .then(([pasados, proximos]) => {
        setPlayed(pasados.data)
        setUpcoming(proximos.data)
      })
      .catch(() => setError('No se pudieron cargar las estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  const withScore = played.filter(hasScore)
  const teamNames = [...new Set([...TEAM_NAMES, ...[...played, ...upcoming].flatMap(m => [m.equipo_local, m.equipo_visitante])])]
  const tabla = buildTable(withScore, teamNames)
  const totalGoles = withScore.reduce((sum, m) => sum + m.goles_local + m.goles_visitante, 0)
  const promedio = withScore.length ? (totalGoles / withScore.length).toFixed(1).replace('.', ',') : '—'
  const ultimos = played.slice(0, 5)

  return (
    <div className="min-h-screen bg-noche font-body text-tiza">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-9 px-4 pb-20 pt-10 sm:px-8 lg:pt-14 xl:px-12 2xl:px-20">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold tracking-[0.15em] text-gris">PRIMERA DIVISIÓN DE CHILE</span>
          <h1 className="font-display text-5xl uppercase italic leading-[0.9] sm:text-7xl">Estadísticas</h1>
        </div>

        {error && (
          <div role="alert" className="rounded-[14px] border border-roja-borde bg-roja-suave px-4 py-3.5 text-sm font-semibold text-roja">{error}</div>
        )}

        {loading ? (
          <div className="flex flex-col gap-6" aria-hidden="true">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse rounded-3xl bg-grada" />)}
            </div>
            <div className="h-[520px] animate-pulse rounded-3xl bg-grada" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatTile label="Partidos jugados" value={withScore.length} hint="con resultado confirmado" />
              <StatTile label="Goles" value={totalGoles} hint="en todos los partidos" />
              <StatTile label="Promedio" value={promedio} hint="goles por partido" />
              <StatTile label="Próximos" value={upcoming.length} hint="partidos por jugar" />
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <Panel title="Tabla de posiciones">
                {withScore.length === 0 && (
                  <p className="-mt-1 text-[13px] text-gris">Aún no hay partidos con resultado. La tabla se completará a medida que se jueguen.</p>
                )}
                <div className="-mx-2 overflow-x-auto px-2">
                  <table className="w-full min-w-[320px] border-separate border-spacing-y-1.5 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-extrabold tracking-wider text-gris">
                        <th scope="col" className="w-10 px-3 py-2 font-extrabold">#</th>
                        <th scope="col" className="px-3 py-2 font-extrabold">EQUIPO</th>
                        <th scope="col" className="px-2 py-2 text-center font-extrabold" title="Partidos jugados">PJ</th>
                        <th scope="col" className="hidden px-2 py-2 text-center font-extrabold sm:table-cell" title="Ganados">G</th>
                        <th scope="col" className="hidden px-2 py-2 text-center font-extrabold sm:table-cell" title="Empatados">E</th>
                        <th scope="col" className="hidden px-2 py-2 text-center font-extrabold sm:table-cell" title="Perdidos">P</th>
                        <th scope="col" className="hidden px-2 py-2 text-center font-extrabold md:table-cell" title="Goles a favor">GF</th>
                        <th scope="col" className="hidden px-2 py-2 text-center font-extrabold md:table-cell" title="Goles en contra">GC</th>
                        <th scope="col" className="px-2 py-2 text-center font-extrabold" title="Diferencia de goles">DG</th>
                        <th scope="col" className="hidden px-3 py-2 font-extrabold lg:table-cell">FORMA</th>
                        <th scope="col" className="px-3 py-2 text-right font-extrabold" title="Puntos">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabla.map((equipo, idx) => (
                        <tr key={equipo.nombre} className="bg-pasto">
                          <td className={`rounded-l-[14px] px-3 py-3 font-display text-xl italic ${idx === 0 && withScore.length ? 'text-volt' : 'text-gris'}`}>{idx + 1}</td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-3">
                              <Crest name={equipo.nombre} className="h-8 w-8 text-xs" />
                              <span className="font-bold">{equipo.nombre}</span>
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center font-cifras text-niebla">{equipo.jugados}</td>
                          <td className="hidden px-2 py-3 text-center font-cifras text-niebla sm:table-cell">{equipo.ganados}</td>
                          <td className="hidden px-2 py-3 text-center font-cifras text-niebla sm:table-cell">{equipo.empatados}</td>
                          <td className="hidden px-2 py-3 text-center font-cifras text-niebla sm:table-cell">{equipo.perdidos}</td>
                          <td className="hidden px-2 py-3 text-center font-cifras text-niebla md:table-cell">{equipo.golesFavor}</td>
                          <td className="hidden px-2 py-3 text-center font-cifras text-niebla md:table-cell">{equipo.golesContra}</td>
                          <td className={`px-2 py-3 text-center font-cifras ${equipo.dg > 0 ? 'text-volt' : equipo.dg < 0 ? 'text-roja' : 'text-niebla'}`}>
                            {equipo.dg > 0 ? '+' : ''}{equipo.dg}
                          </td>
                          <td className="hidden px-3 py-3 lg:table-cell">
                            {equipo.forma.length === 0 ? (
                              <span className="text-gris">—</span>
                            ) : (
                              <span className="flex gap-1">
                                {equipo.forma.map((r, i) => (
                                  <span key={i} className={`flex h-6 w-6 items-center justify-center rounded-md font-display text-sm italic ${FORM_STYLES[r]}`} title={{ G: 'Ganó', E: 'Empató', P: 'Perdió' }[r]}>{r}</span>
                                ))}
                              </span>
                            )}
                          </td>
                          <td className="rounded-r-[14px] px-3 py-3 text-right font-cifras text-base font-bold">{equipo.puntos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gris">Orden: puntos, diferencia de goles y goles a favor. Forma: últimos 5 partidos (G ganó, E empató, P perdió).</p>
              </Panel>

              <aside className="flex flex-col gap-4">
                <Panel title="Últimos resultados">
                  {ultimos.length === 0 ? (
                    <p className="text-niebla">Todavía no se ha jugado ningún partido.</p>
                  ) : (
                    <ul className="flex flex-col gap-2 pl-0">
                      {ultimos.map(m => (
                        <li key={m.id} className="flex flex-col gap-2 rounded-2xl bg-pasto p-4">
                          <span className="text-xs font-bold text-gris">{new Date(m.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
                          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                            <span className="flex min-w-0 items-center gap-2">
                              <Crest name={m.equipo_local} className="h-7 w-7 text-[11px]" />
                              <span className="truncate text-sm font-bold">{m.equipo_local}</span>
                            </span>
                            {hasScore(m) ? (
                              <span className="rounded-lg bg-noche px-2.5 py-1 font-cifras text-base font-bold">{m.goles_local} – {m.goles_visitante}</span>
                            ) : (
                              m.estado === 'suspendido' ? (
                                <span className="rounded-lg bg-pasto-alto px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-niebla">SUSPENDIDO</span>
                              ) : (
                                <span className="rounded-lg bg-ambar-suave px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-ambar">POR CONFIRMAR</span>
                              )
                            )}
                            <span className="flex min-w-0 items-center justify-end gap-2">
                              <span className="truncate text-right text-sm font-bold">{m.equipo_visitante}</span>
                              <Crest name={m.equipo_visitante} className="h-7 w-7 text-[11px]" />
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel
                  title="Próximos"
                  action={<Link to="/matches" className="text-sm font-bold text-volt no-underline hover:text-[#E2FF8A]">Apostar</Link>}
                >
                  {upcoming.length === 0 ? (
                    <p className="text-niebla">No hay partidos programados.</p>
                  ) : (
                    <ul className="flex flex-col gap-2 pl-0">
                      {upcoming.slice(0, 4).map(m => (
                        <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-pasto p-4">
                          <div className="flex">
                            <Crest name={m.equipo_local} className="h-8 w-8 border-2 border-pasto text-xs" />
                            <Crest name={m.equipo_visitante} className="-ml-2 h-8 w-8 border-2 border-pasto text-xs" />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="text-sm font-bold">{m.equipo_local} vs {m.equipo_visitante}</span>
                            <span className="text-xs text-gris">{formatKickoff(m.fecha)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
