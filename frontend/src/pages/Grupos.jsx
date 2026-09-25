import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Grupos.css'

export default function Grupos({ token, user }) {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCrearGrupo, setShowCrearGrupo] = useState(false)
  const [showUnirse, setShowUnirse] = useState(false)
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: '', descripcion: '' })
  const [codigoUnirse, setCodigoUnirse] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchGrupos()
  }, [])

  const fetchGrupos = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/grupos', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setGrupos(response.data)
      setLoading(false)
    } catch (err) {
      setError('Error al cargar los grupos')
      setLoading(false)
    }
  }

  const handleCrearGrupo = async (e) => {
    e.preventDefault()
    setError('')
    setMensajeExito('')

    if (!nuevoGrupo.nombre.trim()) {
      setError('El nombre del grupo es requerido')
      return
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/grupos',
        nuevoGrupo,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setMensajeExito('¡Grupo creado exitosamente!')
      setNuevoGrupo({ nombre: '', descripcion: '' })
      setShowCrearGrupo(false)
      fetchGrupos()

      setTimeout(() => setMensajeExito(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el grupo')
    }
  }

  const handleUnirse = async (e) => {
    e.preventDefault()
    setError('')
    setMensajeExito('')

    if (!codigoUnirse.trim()) {
      setError('Ingresa el código de invitación')
      return
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/grupos/unirse',
        { codigo: codigoUnirse },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setMensajeExito('¡Te has unido al grupo!')
      setCodigoUnirse('')
      setShowUnirse(false)
      fetchGrupos()

      setTimeout(() => setMensajeExito(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al unirse al grupo')
    }
  }

  if (loading) {
    return <div className="container"><p>Cargando grupos...</p></div>
  }

  return (
    <div className="grupos-container">
      <div className="container">
        <div className="grupos-header">
          <h1>👥 Mis Grupos de Apuestas</h1>
          <div className="header-buttons">
            <button className="btn-primary" onClick={() => setShowCrearGrupo(true)}>
              ➕ Crear Grupo
            </button>
            <button className="btn-secondary" onClick={() => setShowUnirse(true)}>
              🔗 Unirse a Grupo
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {mensajeExito && <div className="success">{mensajeExito}</div>}

        {grupos.length === 0 ? (
          <div className="empty-state">
            <p>No tienes grupos aún</p>
            <button className="btn-primary" onClick={() => setShowCrearGrupo(true)}>
              Crear tu primer grupo
            </button>
          </div>
        ) : (
          <div className="grupos-grid">
            {grupos.map(grupo => (
              <div key={grupo.id} className="grupo-card">
                <div className="grupo-header">
                  <h3>{grupo.nombre}</h3>
                  <span className="badge">Grupo</span>
                </div>

                <p className="descripcion">{grupo.descripcion || 'Sin descripción'}</p>

                <div className="grupo-info">
                  <small>Código: <strong>{grupo.codigo_invitacion}</strong></small>
                </div>

                <button
                  className="btn-detail"
                  onClick={() => navigate(`/grupos/${grupo.id}`)}
                >
                  Ver Detalles →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal Crear Grupo */}
        {showCrearGrupo && (
          <div className="modal-overlay" onClick={() => setShowCrearGrupo(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Crear Nuevo Grupo</h2>
              <form onSubmit={handleCrearGrupo}>
                <div className="form-group">
                  <label>Nombre del Grupo *</label>
                  <input
                    type="text"
                    value={nuevoGrupo.nombre}
                    onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })}
                    placeholder="Ej: Los Campeones"
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={nuevoGrupo.descripcion}
                    onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, descripcion: e.target.value })}
                    placeholder="Ej: Grupo de amigos para apuestas"
                    rows="3"
                  />
                </div>

                <div className="modal-buttons">
                  <button type="submit" className="btn-submit">Crear Grupo</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowCrearGrupo(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Unirse a Grupo */}
        {showUnirse && (
          <div className="modal-overlay" onClick={() => setShowUnirse(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Unirse a un Grupo</h2>
              <form onSubmit={handleUnirse}>
                <div className="form-group">
                  <label>Código de Invitación *</label>
                  <input
                    type="text"
                    value={codigoUnirse}
                    onChange={(e) => setCodigoUnirse(e.target.value.toUpperCase())}
                    placeholder="Ej: GRPABCD1234"
                  />
                  <small>Pide el código a un miembro del grupo</small>
                </div>

                <div className="modal-buttons">
                  <button type="submit" className="btn-submit">Unirse</button>
                  <button type="button" className="btn-cancel" onClick={() => setShowUnirse(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
