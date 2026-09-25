import { Link } from 'react-router-dom'
import './Navigation.css'

export default function Navigation({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          ⚽ APUESTAS DEPORTIVAS
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="nav-link">Inicio</Link>
          <Link to="/estadisticas" className="nav-link">Estadísticas</Link>

          {user ? (
            <>
              <Link to="/matches" className="nav-link">Partidos</Link>
              <Link to="/mis-apuestas" className="nav-link">Mis Apuestas</Link>
              <Link to="/grupos" className="nav-link">Grupos</Link>
              <div className="user-info">
                <span>{user.nombre}</span>
                <span className="saldo">Saldo: ${parseFloat(user.saldo).toFixed(2)}</span>
              </div>
              <button className="nav-link logout-btn" onClick={onLogout}>
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link btn-primary-nav">Registro</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
