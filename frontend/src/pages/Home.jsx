import { Link } from 'react-router-dom'
import './Home.css'

export default function Home({ user }) {
  return (
    <div className="home">
      <div className="hero">
        <h1>⚽ Bienvenido a Apuestas Deportivas</h1>
        <p>Tu plataforma confiable para apostar en la Primera División Chilena</p>

        {!user ? (
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
            <Link to="/register" className="btn btn-secondary">Registrarse</Link>
          </div>
        ) : (
          <div className="hero-buttons">
            <Link to="/matches" className="btn btn-primary">Ver Partidos Disponibles</Link>
            <Link to="/mis-apuestas" className="btn btn-secondary">Mis Apuestas</Link>
          </div>
        )}
      </div>

      <div className="container">
        <section className="features">
          <h2>¿Por qué elegir nuestro sitio?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🎯 Partidos en Vivo</h3>
              <p>Accede a los próximos partidos de la Primera División Chilena</p>
            </div>
            <div className="feature-card">
              <h3>💰 Saldo Virtual</h3>
              <p>Comienza con $1000 de crédito para tus apuestas</p>
            </div>
            <div className="feature-card">
              <h3>📊 Historial Completo</h3>
              <p>Revisa todas tus apuestas y ganancias</p>
            </div>
            <div className="feature-card">
              <h3>⚡ Rápido y Seguro</h3>
              <p>Plataforma 100% segura con autenticación encriptada</p>
            </div>
          </div>
        </section>

        <section className="stats">
          <h2>Estadísticas</h2>
          <div className="stats-grid">
            <div className="stat">
              <h4>Usuarios Activos</h4>
              <p className="big-number">1,234</p>
            </div>
            <div className="stat">
              <h4>Apuestas Realizadas</h4>
              <p className="big-number">5,678</p>
            </div>
            <div className="stat">
              <h4>Ganancias Distribuidas</h4>
              <p className="big-number">$234,567</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
