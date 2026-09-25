import { useState, useEffect } from 'react'
import axios from 'axios'
import './MyBets.css'

export default function MyBets({ token }) {
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBets()
  }, [])

  const fetchBets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bets', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBets(response.data)
      setLoading(false)
    } catch (err) {
      setError('Error al cargar las apuestas')
      setLoading(false)
    }
  }

  const getPredictionLabel = (pred) => {
    switch (pred) {
      case '1':
        return 'Local'
      case 'X':
        return 'Empate'
      case '2':
        return 'Visitante'
      default:
        return pred
    }
  }

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'ganada':
        return <span className="badge badge-success">✓ Ganada</span>
      case 'perdida':
        return <span className="badge badge-danger">✗ Perdida</span>
      case 'pendiente':
        return <span className="badge badge-pending">⏳ Pendiente</span>
      default:
        return <span className="badge">{estado}</span>
    }
  }

  if (loading) {
    return <div className="container"><p>Cargando apuestas...</p></div>
  }

  return (
    <div className="mybets-container">
      <div className="container">
        <h1>📊 Mis Apuestas</h1>

        {error && <div className="error">{error}</div>}

        {bets.length === 0 ? (
          <div className="empty-state">
            <p>Aún no tienes apuestas realizadas</p>
            <p><a href="/matches">Ir a apostar</a></p>
          </div>
        ) : (
          <>
            <div className="stats-summary">
              <div className="stat">
                <h4>Total de Apuestas</h4>
                <p>{bets.length}</p>
              </div>
              <div className="stat">
                <h4>Ganadas</h4>
                <p className="success">{bets.filter(b => b.estado === 'ganada').length}</p>
              </div>
              <div className="stat">
                <h4>Perdidas</h4>
                <p className="danger">{bets.filter(b => b.estado === 'perdida').length}</p>
              </div>
              <div className="stat">
                <h4>Pendientes</h4>
                <p className="pending">{bets.filter(b => b.estado === 'pendiente').length}</p>
              </div>
            </div>

            <div className="bets-list">
              {bets.map(bet => (
                <div key={bet.id} className="bet-item">
                  <div className="bet-match">
                    <h4>
                      {bet.equipo_local} vs {bet.equipo_visitante}
                    </h4>
                    <p className="prediction">
                      Apuesta: <strong>{getPredictionLabel(bet.prediccion)}</strong>
                    </p>
                  </div>

                  <div className="bet-details">
                    <div className="detail">
                      <span className="label">Monto:</span>
                      <span className="value">${parseFloat(bet.monto).toFixed(2)}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Cuota:</span>
                      <span className="value">1.85</span>
                    </div>
                    {bet.estado !== 'pendiente' && (
                      <div className="detail">
                        <span className="label">Ganancia:</span>
                        <span className="value">
                          ${bet.ganancia ? parseFloat(bet.ganancia).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bet-status">
                    {getStatusBadge(bet.estado)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
