import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Matches from './pages/Matches'
import MyBets from './pages/MyBets'
import Stats from './pages/Stats'
import Grupos from './pages/Grupos'
import GrupoDetalle from './pages/GrupoDetalle'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (savedToken && savedUser) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/verify', {
            headers: { Authorization: `Bearer ${savedToken}` }
          })

          setToken(savedToken)
          setUser(response.data.user)
        } catch (error) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    verifyAuth()
  }, [])

  const handleLogin = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <Router>
      <Navigation user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={token ? <Navigate to="/matches" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register" element={token ? <Navigate to="/matches" /> : <Register />} />
        <Route
          path="/matches"
          element={token ? <Matches token={token} user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/mis-apuestas"
          element={token ? <MyBets token={token} /> : <Navigate to="/login" />}
        />
        <Route
          path="/estadisticas"
          element={<Stats />}
        />
        <Route
          path="/grupos"
          element={token ? <Grupos token={token} user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/grupos/:id"
          element={token ? <GrupoDetalle token={token} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  )
}

export default App
