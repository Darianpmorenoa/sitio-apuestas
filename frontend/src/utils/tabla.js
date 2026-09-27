export const hasScore = (m) => m.goles_local !== null && m.goles_visitante !== null

// Tabla de posiciones a partir de los partidos con marcador
export const buildTable = (played, teamNames) => {
  const rows = {}
  teamNames.forEach(nombre => {
    rows[nombre] = { nombre, jugados: 0, ganados: 0, empatados: 0, perdidos: 0, golesFavor: 0, golesContra: 0, forma: [] }
  })

  // Del más antiguo al más reciente, para que la forma quede en orden
  ;[...played].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).forEach(match => {
    const local = rows[match.equipo_local]
    const visitante = rows[match.equipo_visitante]
    if (!local || !visitante) return

    local.jugados++
    visitante.jugados++
    local.golesFavor += match.goles_local
    local.golesContra += match.goles_visitante
    visitante.golesFavor += match.goles_visitante
    visitante.golesContra += match.goles_local

    if (match.goles_local > match.goles_visitante) {
      local.ganados++; visitante.perdidos++
      local.forma.push('G'); visitante.forma.push('P')
    } else if (match.goles_local < match.goles_visitante) {
      visitante.ganados++; local.perdidos++
      visitante.forma.push('G'); local.forma.push('P')
    } else {
      local.empatados++; visitante.empatados++
      local.forma.push('E'); visitante.forma.push('E')
    }
  })

  return Object.values(rows)
    .map(r => ({ ...r, puntos: r.ganados * 3 + r.empatados, dg: r.golesFavor - r.golesContra, forma: r.forma.slice(-5) }))
    .sort((a, b) =>
      b.puntos - a.puntos ||
      b.dg - a.dg ||
      b.golesFavor - a.golesFavor ||
      a.nombre.localeCompare(b.nombre, 'es'))
}
