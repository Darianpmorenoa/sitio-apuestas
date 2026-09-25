import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import './GrupoDetalle.css'

export default function GrupoDetalle({ token }) {
  const { id } = useParams()
  const [grupo, setGrupo] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [apuestas, setApuestas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkWhatsApp, setLinkWhatsApp] = useState('')
  const [showCompartir, setShowCompartir] = useState(false)

  useEffect(() => {
    fetchGrupoDetalle()
  }, [id])

  const fetchGrupoDetalle = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/grupos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setGrupo(response.data.grupo)
      setMiembros(response.data.miembros)
      setApuestas(response.data.apuestas)
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el grupo')
      setLoading(false)
    }
  }

  const handleGenerarLinkWhatsApp = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/grupos/${id}/whatsapp`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setLinkWhatsApp(response.data.linkWhatsApp)
      setShowCompartir(true)
    } catch (err) {
      setError('Solo admin puede generar invitaciones')
    }
  }

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(grupo.codigo_invitacion)
    alert('Código copiado al portapapeles!')
  }

  if (loading) {
    return <div className="container"><p>Cargando...</p></div>
  }

  if (!grupo) {
    return <div className="container"><p>Grupo no encontrado</p></div>
  }

  return (
    <div className="grupo-detalle-container">
      <div className="container">
        <div className="grupo-header-detail">
          <h1>{grupo.nombre}</h1>
          <button className="btn-back" onClick={() => window.history.back()}>
            ← Volver
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="detalle-grid">
          {/* Información del Grupo */}
          <section className="seccion">
            <h2>📋 Información del Grupo</h2>
            <div className="info-box">
              <p><strong>Descripción:</strong> {grupo.descripcion || 'Sin descripción'}</p>
              <p>
                <strong>Código de Invitación:</strong>
                <div className="codigo-box">
                  <code>{grupo.codigo_invitacion}</code>
                  <button className="btn-copiar" onClick={handleCopiarCodigo}>
                    📋 Copiar
                  </button>
                </div>
              </p>
            </div>
          </section>

          {/* Miembros */}
          <section className="seccion">
            <h2>👥 Miembros ({miembros.length})</h2>
            <div className="miembros-list">
              {miembros.map(miembro => (
                <div key={miembro.id} className="miembro-item">
                  <div>
                    <strong>{miembro.nombre}</strong>
                    <p>{miembro.email}</p>
                  </div>
                  <span className={`rol ${miembro.rol}`}>
                    {miembro.rol === 'admin' ? '👑 Admin' : '👤 Miembro'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Invitar */}
          <section className="seccion">
            <h2>🔗 Invitar Amigos</h2>
            <button className="btn-primary" onClick={handleGenerarLinkWhatsApp}>
              Generar Link WhatsApp
            </button>
          </section>

          {/* Apuestas del Grupo */}
          <section className="seccion full-width">
            <h2>⚽ Apuestas del Grupo ({apuestas.length})</h2>
            {apuestas.length === 0 ? (
              <p className="empty">No hay apuestas en este grupo aún</p>
            ) : (
              <div className="apuestas-table">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Partido</th>
                      <th>Predicción</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apuestas.map(apuesta => (
                      <tr key={apuesta.id}>
                        <td>{apuesta.usuario_id}</td>
                        <td>{apuesta.partido_id}</td>
                        <td>{apuesta.prediccion}</td>
                        <td>${parseFloat(apuesta.monto).toFixed(2)}</td>
                        <td>
                          <span className={`estado ${apuesta.estado}`}>
                            {apuesta.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Modal Compartir WhatsApp */}
        {showCompartir && (
          <div className="modal-overlay" onClick={() => setShowCompartir(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>🔗 Compartir en WhatsApp</h2>
              <p>Dale click al botón de abajo para enviar la invitación por WhatsApp:</p>

              <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                💬 Abrir WhatsApp
              </a>

              <p className="info-texto">
                También puedes compartir este código directamente:
                <div className="codigo-box">
                  <code>{grupo.codigo_invitacion}</code>
                  <button
                    className="btn-copiar"
                    onClick={() => {
                      navigator.clipboard.writeText(grupo.codigo_invitacion)
                      alert('Código copiado!')
                    }}
                  >
                    📋 Copiar
                  </button>
                </div>
              </p>

              <button className="btn-cerrar" onClick={() => setShowCompartir(false)}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
