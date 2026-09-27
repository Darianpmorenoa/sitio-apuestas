import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const formatMoney = (value) => {
  const n = Number(value) || 0
  const decimals = Number.isInteger(n) ? 0 : 2
  return `$${n.toLocaleString('es-CL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'

const firstName = (name = '') => name.split(/\s+/)[0] || name

// Íconos de trazo (24x24); heredan el color del texto
const ICONS = {
  inicio: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  partidos: <><circle cx="12" cy="12" r="9" /><path d="m12 7 4 3-1.5 4.5h-5L8 10z" /></>,
  apuestas: <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z" />,
  tabla: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  grupos: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>,
  entrar: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></>,
  registro: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M19 8v6M16 11h6" /></>,
  billetera: <><path d="M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" /><path d="M3 7l12-4v4" /><circle cx="16.5" cy="13.5" r="1.2" /></>,
  salir: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
  flecha: <path d="m6 9 6 6 6-6" />,
  admin: <><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></>
}

function Icon({ name, size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 text-tiza no-underline" aria-label="Ir al inicio">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true" className="h-[30px] w-[30px] lg:h-[34px] lg:w-[34px]">
        <rect x="1" y="1" width="32" height="32" rx="9" fill="#C8FF2E" />
        <path d="M9 23 L15 11 L19 19 L22 14 L26 23" stroke="#0A0E14" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[22px] italic tracking-wide lg:text-2xl">APUESTAS<span className="text-volt">.CL</span></span>
        <span className="mt-[3px] hidden text-[10px] font-bold tracking-[0.2em] text-gris lg:block">PRIMERA DIVISIÓN</span>
      </span>
    </Link>
  )
}

function SaldoChip({ saldo, compact = false }) {
  return (
    <Link
      to="/mis-apuestas"
      className="flex h-10 items-center gap-2 rounded-full border border-[#2A3545] bg-[#131A24] pl-3 pr-3.5 text-tiza no-underline transition-colors hover:border-linea-fuerte lg:h-11 lg:gap-2.5 lg:pr-4"
      aria-label={`Saldo: ${formatMoney(saldo)}. Ver mis apuestas`}
    >
      {compact
        ? <span className="h-2 w-2 rounded-full bg-volt" aria-hidden="true" />
        : <Icon name="billetera" className="text-volt" />}
      {!compact && <span className="text-[11px] font-bold tracking-wider text-gris">SALDO</span>}
      <span className="font-cifras text-sm font-bold lg:text-[15px]">{formatMoney(saldo)}</span>
    </Link>
  )
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const itemClass = 'flex h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold no-underline transition-colors hover:bg-pasto'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de usuario"
        className="flex h-10 items-center gap-2.5 rounded-full border border-[#2A3545] bg-transparent p-1 font-body text-tiza transition-colors hover:border-linea-fuerte lg:h-11 lg:pr-2.5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2B1F5C] text-xs font-extrabold text-[#D9CCFF] lg:h-9 lg:w-9 lg:text-[13px]">
          {initials(user.nombre)}
        </span>
        <span className="hidden text-sm font-bold lg:inline">{firstName(user.nombre)}</span>
        <Icon name="flecha" size={16} className={`hidden text-gris transition-transform lg:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-50 flex w-[300px] flex-col rounded-[20px] border border-[#2A3545] bg-grada p-2 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2B1F5C] text-[15px] font-extrabold text-[#D9CCFF]">
              {initials(user.nombre)}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[15px] font-extrabold">{user.nombre}</span>
              {user.email && <span className="truncate text-[13px] text-gris">{user.email}</span>}
            </div>
          </div>
          <div className="mx-2 mb-2 flex items-center justify-between rounded-2xl bg-pasto p-3.5">
            <span className="text-[13px] text-gris">Saldo disponible</span>
            <span className="font-cifras text-base font-bold text-volt">{formatMoney(user.saldo)}</span>
          </div>
          <Link to="/mis-apuestas" role="menuitem" className={`${itemClass} text-tiza`}>
            <Icon name="apuestas" size={18} className="text-gris" />Mis apuestas
          </Link>
          <Link to="/grupos" role="menuitem" className={`${itemClass} text-tiza`}>
            <Icon name="grupos" size={18} className="text-gris" />Mis grupos
          </Link>
          {user.es_admin && (
            <Link to="/admin" role="menuitem" className={`${itemClass} text-tiza`}>
              <Icon name="admin" size={18} className="text-volt" />Panel de administración
            </Link>
          )}
          <div className="mx-2 my-1.5 h-px bg-linea" />
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className={`${itemClass} w-full bg-transparent text-left font-body font-bold text-roja`}
          >
            <Icon name="salir" size={18} />Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default function Navigation({ user, onLogout }) {
  const links = user
    ? [
        { to: '/', label: 'Inicio', short: 'Inicio', icon: 'inicio', end: true },
        { to: '/matches', label: 'Partidos', short: 'Partidos', icon: 'partidos' },
        { to: '/mis-apuestas', label: 'Mis apuestas', short: 'Apuestas', icon: 'apuestas' },
        { to: '/estadisticas', label: 'Estadísticas', short: 'Tabla', icon: 'tabla' },
        { to: '/grupos', label: 'Grupos', short: 'Grupos', icon: 'grupos' }
      ]
    : [
        { to: '/', label: 'Inicio', short: 'Inicio', icon: 'inicio', end: true },
        { to: '/estadisticas', label: 'Estadísticas', short: 'Tabla', icon: 'tabla' }
      ]

  const mobileLinks = user
    ? links
    : [
        ...links,
        { to: '/login', short: 'Entrar', icon: 'entrar' },
        { to: '/register', short: 'Registro', icon: 'registro' }
      ]

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#1E2735] bg-[#0A0E14] font-body text-tiza">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-10 px-4 sm:px-8 lg:h-[72px] xl:px-10">
          <Logo />

          <nav aria-label="Principal" className="hidden h-full flex-1 items-stretch gap-1 lg:flex">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center border-b-2 px-4 text-sm font-bold no-underline transition-colors ${
                    isActive ? 'border-volt text-volt' : 'border-transparent text-niebla hover:text-tiza'
                  }`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-3">
            {user ? (
              <>
                <span className="lg:hidden"><SaldoChip saldo={user.saldo} compact /></span>
                <span className="hidden lg:block"><SaldoChip saldo={user.saldo} /></span>
                <UserMenu user={user} onLogout={onLogout} />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex h-10 items-center rounded-xl border border-[#2A3545] px-4 text-sm font-bold text-tiza no-underline transition-colors hover:border-linea-fuerte lg:h-11 lg:px-[18px]"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="hidden h-11 items-center rounded-xl bg-volt px-5 text-sm font-extrabold text-noche no-underline transition-colors hover:bg-[#D8FF6A] sm:flex"
                >
                  Regístrate y recibe $1.000
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <nav
        aria-label="Principal móvil"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1E2735] bg-[#0A0E14] pb-[env(safe-area-inset-bottom)] font-body lg:hidden"
      >
        <div className="mx-auto grid h-[68px] max-w-lg gap-0 px-2" style={{ gridTemplateColumns: `repeat(${mobileLinks.length}, minmax(0, 1fr))` }}>
          {mobileLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 text-[11px] no-underline ${
                  isActive ? 'font-extrabold text-volt' : 'font-bold text-niebla'
                }`}
            >
              <Icon name={link.icon} size={22} />
              {link.short}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
