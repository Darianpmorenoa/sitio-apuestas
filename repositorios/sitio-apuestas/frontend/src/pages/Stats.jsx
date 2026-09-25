import { useState, useEffect } from 'react'
import axios from 'axios'
import './Stats.css'

export default function Stats() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/matches')
      setMatches(response.data)
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  const stats = {
    totalPartidos: matches.length,
    equipos: [...new Set(matches.flatMap(m => [m.equipo_local, m.equipo_visitante]))],
    partidos: matches
  }

  const equipoStats = {}
  stats.equipos.forEach(equipo => {
    equipoStats[equipo] = {
      nombre: equipo,
      jugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      golesFavor: 0,
      golesContra: 0
    }
  })

  matches.forEach(match => {
    if (match.goles_local !== null && match.goles_visitante !== null) {
      const local = equipoStats[match.equipo_local]
      const visitante = equipoStats[match.equipo_visitante]

      local.jugados++
      visitante.jugados++
      local.golesFavor += match.goles_local
      local.golesContra += match.goles_visitante
      visitante.golesFavor += match.goles_visitante
      visitante.golesContra += match.goles_local

      if (match.goles_local > match.goles_visitante) {
        local.ganados++
        visitante.perdidos++
      } else if (match.goles_local < match.goles_visitante) {
        visitante.ganados++
        local.perdidos++
      } else {
        local.empatados++
        visitante.empatados++
      }
    }
  })

  const tablaPosiciones = Object.values(equipoStats)
    .sort((a, b) => {
      const puntosA = a.ganados * 3 + a.empatados
      const puntosB = b.ganados * 3 + b.empatados
      return puntosB - puntosA
    })

  if (loading) {
    return <div className="container"><p>Cargando estadísticas...</p></div>
  }

  return (
    <div className="stats-container">
      <div className="container">
        <h1>📊 Estadísticas de la Primera División</h1>

        <div className="stats-overview">
          <div className="stat-card">
            <h3>Total de Partidos</h3>
            <p className="big-number">{stats.totalPartidos}</p>
          </div>
          <div className="stat-card">
            <h3>Equipos Participantes</h3>
            <p className="big-number">{stats.equipos.length}</p>
          </div>
          <div className="stat-card">
            <h3>Goles Totales</h3>
            <p className="big-number">
              {matches.reduce((total, m) => total + (m.goles_local || 0) + (m.goles_visitante || 0), 0)}
            </p>
          </div>
          <div className="stat-card">
            <h3>Promedio de Goles</h3>
            <p className="big-number">
              {(matches.reduce((total, m) => total + (m.goles_local || 0) + (m.goles_visitante || 0), 0) / (stats.totalPartidos || 1)).toFixed(1)}
            </p>
          </div>
        </div>

        <section className="tabla-posiciones">
          <h2>⚽ Tabla de Posiciones</h2>
          <table className="tabla">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Equipo</th>
                <th>PJ</th>
                <th>G</th>
                <th>E</th>
                <th>P</th>
                <th>GF</th>
                <th>GC</th>
                <th>DG</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {tablaPosiciones.map((equipo, idx) => {
                const puntos = equipo.ganados * 3 + equipo.empatados
                const dg = equipo.golesFavor - equipo.golesContra
                return (
                  <tr key={equipo.nombre} className={idx < 4 ? 'internacional' : idx < 6 ? 'sudamericana' : ''}>
                    <td className="posicion">{idx + 1}</td>
                    <td className="equipo">{equipo.nombre}</td>
                    <td>{equipo.jugados}</td>
                    <td className="ganados">{equipo.ganados}</td>
                    <td className="empatados">{equipo.empatados}</td>
                    <td className="perdidos">{equipo.perdidos}</td>
                    <td className="goles">{equipo.golesFavor}</td>
                    <td className="goles">{equipo.golesContra}</td>
                    <td className="dg">{dg > 0 ? '+' : ''}{dg}</td>
                    <td className="puntos"><strong>{puntos}</strong></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="leyenda">
            <p>🏆 <span className="internacional">Clasificados a Internacional</span></p>
            <p>🏅 <span className="sudamericana">Clasificados a Sudamericana</span></p>
          </div>
        </section>

        <section className="ultimos-resultados">
          <h2>📋 Últimos Resultados</h2>
          <div className="resultados-list">
            {matches
              .filter(m => m.goles_local !== null && m.goles_visitante !== null)
              .slice(-5)
              .reverse()
              .map(match => (
                <div key={match.id} className="resultado-card">
                  <div className="resultado-teams">
                    <span className="team">{match.equipo_local}</span>
                    <span className="score">
                      {match.goles_local} - {match.goles_visitante}
                    </span>
                    <span className="team">{match.equipo_visitante}</span>
                  </div>
                  <p className="fecha">
                    {new Date(match.fecha).toLocaleDateString('es-CL')}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}
