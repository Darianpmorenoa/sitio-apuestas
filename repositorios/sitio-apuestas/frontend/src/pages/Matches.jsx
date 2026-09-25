import { useState, useEffect } from 'react'
import axios from 'axios'
import './Matches.css'

export default function Matches({ token, user }) {
  if (!user) {
    return <div className="container"><p>Cargando usuario...</p></div>
  }

  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [betAmount, setBetAmount] = useState('')
  const [prediction, setPrediction] = useState('1')
  const [bettingLoading, setBettingLoading] = useState(false)
  const [userSaldo, setUserSaldo] = useState(parseFloat(user.saldo) || 0)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/matches')
      setMatches(response.data)
      setLoading(false)
    } catch (err) {
      setError('Error al cargar los partidos')
      setLoading(false)
    }
  }

  const validateBetForm = () => {
    console.log('🔍 Validando formulario:', { betAmount, userSaldo, prediction: prediction });

    if (!betAmount || betAmount === '') {
      console.log('❌ No hay monto');
      setError('Ingresa un monto')
      return false
    }

    const amount = parseFloat(betAmount)
    console.log('💰 Monto:', amount, 'Saldo:', userSaldo);

    if (isNaN(amount) || amount <= 0) {
      console.log('❌ Monto inválido');
      setError('El monto debe ser mayor a 0')
      return false
    }

    if (amount > parseFloat(userSaldo)) {
      console.log('❌ Saldo insuficiente');
      setError(`Saldo insuficiente. Tu saldo: $${parseFloat(userSaldo).toFixed(2)}`)
      return false
    }

    if (amount > 100000) {
      console.log('❌ Monto mayor a máximo');
      setError('El monto máximo por apuesta es $100,000')
      return false
    }

    console.log('✅ Validación exitosa');
    return true
  }

  const handleBet = async () => {
    try {
      setError('')
      setSuccess('')

      const monto = parseFloat(betAmount)
      console.log('🎯 Apuesta:', { partido_id: selectedMatch.id, monto, prediccion: prediction, token: token?.substring(0, 20) });

      if (!monto || monto <= 0) {
        setError('Monto inválido')
        return
      }

      if (monto > parseFloat(userSaldo)) {
        setError('Saldo insuficiente')
        return
      }

      setBettingLoading(true)

      const response = await axios.post(
        'http://localhost:5000/api/bets',
        {
          partido_id: selectedMatch.id,
          monto: monto,
          prediccion: prediction
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      console.log('✅ Apuesta exitosa:', response.data);
      setSuccess('¡Apuesta realizada!')

      const nuevoSaldo = parseFloat(userSaldo) - monto;
      setUserSaldo(nuevoSaldo);

      const usuarioActualizado = { ...user, saldo: nuevoSaldo };
      localStorage.setItem('user', JSON.stringify(usuarioActualizado));

      setBetAmount('')
      setPrediction('1')
      setSelectedMatch(null)
      setBettingLoading(false)
    } catch (err) {
      console.error('❌ Error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.error || 'Error al apostar')
      setBettingLoading(false)
    }
  }

  if (loading) {
    return <div className="container"><p>Cargando partidos...</p></div>
  }

  return (
    <div className="matches-container">
      <div className="container">
        <h1>⚽ Partidos Disponibles</h1>
        <p className="subtitle">Primera División Chilena</p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="matches-grid">
          {matches.length === 0 ? (
            <p>No hay partidos disponibles en este momento</p>
          ) : (
            matches.map(match => (
              <div key={match.id} className="match-card">
                <div className="match-header">
                  <span className="fecha">
                    📅 {new Date(match.fecha).toLocaleDateString('es-CL')}
                  </span>
                  <span className="hora">
                    🕐 {new Date(match.fecha).toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="match-body">
                  <div className="teams">
                    <div className="team">
                      <p className="team-name">{match.equipo_local}</p>
                    </div>
                    <div className="vs">VS</div>
                    <div className="team">
                      <p className="team-name">{match.equipo_visitante}</p>
                    </div>
                  </div>

                  <div className="odds">
                    <div className="odd" onClick={() => {
                      setPrediction('1')
                      setSelectedMatch(match)
                      setError('')
                    }}>
                      <span className="odd-label">Local</span>
                      <span className="odd-value">1.85</span>
                    </div>
                    <div className="odd" onClick={() => {
                      setPrediction('X')
                      setSelectedMatch(match)
                      setError('')
                    }}>
                      <span className="odd-label">Empate</span>
                      <span className="odd-value">3.20</span>
                    </div>
                    <div className="odd" onClick={() => {
                      setPrediction('2')
                      setSelectedMatch(match)
                      setError('')
                    }}>
                      <span className="odd-label">Visitante</span>
                      <span className="odd-value">4.10</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-bet"
                  onClick={() => setSelectedMatch(match)}
                >
                  Apostar
                </button>
              </div>
            ))
          )}
        </div>

        {selectedMatch && (
          <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Realizar Apuesta</h2>
              <p>
                <strong>{selectedMatch.equipo_local}</strong> vs <strong>{selectedMatch.equipo_visitante}</strong>
              </p>

              <div className="modal-form">
                <div className="form-group">
                  <label>Predicción:</label>
                  <select value={prediction} onChange={(e) => setPrediction(e.target.value)}>
                    <option value="1">Victoria Local ({selectedMatch.equipo_local})</option>
                    <option value="X">Empate</option>
                    <option value="2">Victoria Visitante ({selectedMatch.equipo_visitante})</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Monto a apostar ($):</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="Ingresa el monto"
                  />
                  <small>Tu saldo: ${parseFloat(userSaldo).toFixed(2)}</small>
                </div>

                {betAmount && (
                  <div className="bet-calculation">
                    <p>Ganancia potencial: ${(parseFloat(betAmount) * 1.85).toFixed(2)}</p>
                  </div>
                )}

                <div className="modal-buttons">
                  <button
                    className="btn-submit"
                    onClick={handleBet}
                    disabled={bettingLoading}
                  >
                    {bettingLoading ? 'Procesando...' : 'Confirmar Apuesta'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setSelectedMatch(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
