import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { AuthLayout, Field, PasswordField, FormAlert, SubmitButton } from '../components/AuthLayout'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mismas reglas que backend/utils/validators.js
const PASSWORD_RULES = [
  { label: '6+ caracteres', test: (p) => p.length >= 6 },
  { label: 'Una mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Un número', test: (p) => /[0-9]/.test(p) }
]

const BENEFITS = [
  'Saldo virtual: nunca pagas nada',
  'Todos los partidos de la Primera División',
  'Grupos privados con tus amigos'
]

function Check({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}

function PasswordRules({ password }) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
        {PASSWORD_RULES.map((rule, i) => (
          <span key={rule.label} className={`h-1 rounded ${i < passed ? 'bg-volt' : 'bg-linea-fuerte'}`} />
        ))}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[13px] font-semibold">
        {PASSWORD_RULES.map(rule => {
          const ok = rule.test(password)
          return (
            <li key={rule.label} className={`flex items-center gap-1.5 ${ok ? 'text-volt' : 'text-gris'}`}>
              {ok ? <Check /> : <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
              {rule.label}
              <span className="sr-only">{ok ? '(cumple)' : '(pendiente)'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function Register({ onLogin }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    const next = {}

    if (!nombre.trim()) next.nombre = 'El nombre es requerido'
    else if (nombre.trim().length < 3) next.nombre = 'El nombre debe tener al menos 3 caracteres'

    if (!email.trim()) next.email = 'El email es requerido'
    else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Email inválido'

    if (!password) next.password = 'La contraseña es requerida'
    else if (password.length < 6) next.password = 'La contraseña debe tener al menos 6 caracteres'
    else if (!/[A-Z]/.test(password)) next.password = 'La contraseña debe contener al menos una mayúscula'
    else if (!/[0-9]/.test(password)) next.password = 'La contraseña debe contener al menos un número'

    if (password !== confirmPassword) next.confirmPassword = 'Las contraseñas no coinciden'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        password
      })

      const { token, user } = response.data
      setSuccess('¡Cuenta creada! Te dimos $1.000 para empezar. Redirigiendo...')
      setTimeout(() => {
        onLogin(user, token)
        navigate('/matches')
      }, 1500)
    } catch (err) {
      setServerError(err.response?.data?.error || 'Error al registrar el usuario')
      setLoading(false)
    }
  }

  const confirmMismatch = confirmPassword.length > 0 && password !== confirmPassword

  return (
    <AuthLayout
      aside={
        <>
          <div className="flex flex-col gap-5">
            <span className="font-cifras text-[120px] font-bold leading-none tracking-[-4px] text-volt">$1.000</span>
            <h1 className="font-display text-[64px] uppercase italic leading-[0.95]">Para empezar a jugar hoy</h1>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0 text-base font-semibold text-[#D5DCE6]">
            {BENEFITS.map(text => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-volt-suave text-volt"><Check /></span>
                {text}
              </li>
            ))}
          </ul>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-5xl uppercase italic leading-none">Crea tu cuenta</h2>
          <p className="text-[15px] text-gris">Toma menos de un minuto y recibes $1.000 de saldo virtual.</p>
        </div>

        {serverError && <FormAlert>{serverError}</FormAlert>}
        {success && <FormAlert tone="success">{success}</FormAlert>}

        <Field
          id="nombre"
          label="Nombre"
          type="text"
          name="nombre"
          autoComplete="name"
          maxLength={100}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errors.nombre}
          disabled={loading}
        />

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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={<PasswordRules password={password} />}
          disabled={loading}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirmar contraseña"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword || (confirmMismatch ? 'Las contraseñas no coinciden' : undefined)}
          disabled={loading}
        />

        <SubmitButton loading={loading} loadingText="Creando cuenta...">Crear cuenta y recibir $1.000</SubmitButton>

        <p className="text-center text-[13px] leading-relaxed text-gris">
          Al crear tu cuenta aceptas los{' '}
          <Link to="/terminos" className="font-bold text-niebla underline hover:text-tiza">Términos y condiciones</Link>
          {' '}y la{' '}
          <Link to="/privacidad" className="font-bold text-niebla underline hover:text-tiza">Política de privacidad</Link>.
        </p>

        <p className="text-center text-[15px] text-niebla">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-extrabold text-volt no-underline hover:text-[#E2FF8A]">Inicia sesión</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
