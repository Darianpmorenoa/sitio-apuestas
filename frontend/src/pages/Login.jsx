import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { formatKickoff } from '../utils/futbol'
import { AuthLayout, Field, PasswordField, FormAlert, SubmitButton } from '../components/AuthLayout'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Muestra el próximo partido en el panel de marca; si falla, no muestra nada
function NextMatch() {
  const [match, setMatch] = useState(null)

  useEffect(() => {
    axios.get('http://localhost:5000/api/matches')
      .then(({ data }) => {
        const next = data
          .filter(m => m.estado === 'pendiente' && new Date(m.fecha) > new Date())
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0]
        setMatch(next ?? null)
      })
      .catch(() => {})
  }, [])

  if (!match) return null

  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-linea bg-grada px-5 py-[18px]">
      <span className="flex h-[26px] shrink-0 items-center rounded-full bg-volt-suave px-2.5 text-[11px] font-extrabold uppercase tracking-wider text-volt">
        {formatKickoff(match.fecha)}
      </span>
      <span className="flex-1 text-[15px] font-bold">{match.equipo_local} vs {match.equipo_visitante}</span>
      <span className="font-cifras text-sm font-bold text-niebla">1.85 · 3.20 · 4.10</span>
    </div>
  )
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    const next = {}
    if (!email.trim()) next.email = 'El email es requerido'
    else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Email inválido'
    if (!password) next.password = 'La contraseña es requerida'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email.toLowerCase().trim(),
        password
      })

      const { token, user } = response.data
      onLogin(user, token)
      navigate('/matches')
    } catch (err) {
      setServerError(err.response?.data?.error || 'Error al iniciar sesión')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      aside={
        <>
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-[112px] uppercase italic leading-[0.88]">
              Vuelve a<br /><span className="text-volt">la cancha</span>
            </h1>
            <p className="max-w-[440px] text-[17px] leading-relaxed text-niebla">
              Tus apuestas, tu saldo y tus grupos te están esperando.
            </p>
          </div>
          <NextMatch />
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-5xl uppercase italic leading-none">Iniciar sesión</h2>
          <p className="text-[15px] text-gris">Entra con el correo que usaste al registrarte.</p>
        </div>

        {serverError && <FormAlert>{serverError}</FormAlert>}

        <Field
          id="email"
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tu@correo.cl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={loading}
        />

        <PasswordField
          id="password"
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={loading}
        />

        <SubmitButton loading={loading} loadingText="Entrando...">Entrar</SubmitButton>

        <div className="flex items-center gap-4 text-[13px] text-gris" aria-hidden="true">
          <span className="h-px flex-1 bg-linea" />o<span className="h-px flex-1 bg-linea" />
        </div>

        <p className="text-center text-[15px] text-niebla">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-extrabold text-volt no-underline hover:text-[#E2FF8A]">
            Regístrate y recibe $1.000
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
