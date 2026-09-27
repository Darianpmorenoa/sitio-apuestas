import { useState } from 'react'

// Líneas de cancha decorativas del panel de marca
function PitchLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 720 900" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
      <g stroke="#C8FF2E" strokeOpacity="0.08" strokeWidth="2">
        <rect x="60" y="-2" width="600" height="904" />
        <line x1="60" y1="450" x2="660" y2="450" />
        <circle cx="360" cy="450" r="110" />
        <rect x="210" y="-2" width="300" height="140" />
        <rect x="210" y="762" width="300" height="140" />
      </g>
    </svg>
  )
}

// Pantalla dividida: panel de marca a la izquierda (solo escritorio) y formulario a la derecha
export function AuthLayout({ aside, children }) {
  return (
    <div className="grid min-h-[calc(100vh-64px)] bg-noche font-body text-tiza lg:min-h-[calc(100vh-72px)] lg:grid-cols-2">
      <aside className="relative hidden overflow-clip border-r border-[#1E2735] bg-[#0C1118] px-16 py-14 lg:block">
        <PitchLines />
        <div className="relative flex flex-col gap-12 lg:sticky lg:top-32">{aside}</div>
      </aside>
      <main className="flex items-start justify-center px-4 py-10 sm:px-8 lg:items-center lg:py-14">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  )
}

const inputBase =
  'h-14 w-full max-w-none rounded-[14px] border bg-grada px-4 font-body text-base text-tiza outline-none transition-colors placeholder:text-gris/70 focus:border-volt focus:ring-[3px] focus:ring-[#26330C] disabled:cursor-not-allowed disabled:opacity-60 autofill:shadow-[inset_0_0_0_1000px_#0F141C] autofill:[-webkit-text-fill-color:#F2F5F9] autofill:[caret-color:#F2F5F9]'

export function Field({ id, label, error, hint, className = '', children, ...inputProps }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-bold text-niebla">{label}</label>
      {children ?? (
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${error ? 'border-[#FF5C6C]' : 'border-[#2A3545]'}`}
          {...inputProps}
        />
      )}
      {hint && <div id={`${id}-hint`}>{hint}</div>}
      {error && <span id={`${id}-error`} className="text-[13px] font-semibold text-roja">{error}</span>}
    </div>
  )
}

export function PasswordField({ id, label, error, hint, ...inputProps }) {
  const [visible, setVisible] = useState(false)
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} pr-14 ${error ? 'border-[#FF5C6C]' : 'border-[#2A3545]'}`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-[10px] bg-transparent p-0 text-gris transition-colors hover:bg-pasto hover:text-tiza"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
    </Field>
  )
}

export function FormAlert({ tone = 'error', children }) {
  const styles = tone === 'error'
    ? 'border-roja-borde bg-roja-suave text-[#FF9AA3]'
    : 'border-[#4A6417] bg-volt-suave text-volt'
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-center gap-3 rounded-[14px] border px-4 py-3.5 text-sm font-semibold ${styles}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
        {tone === 'error'
          ? <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>
          : <path d="m5 12 5 5 9-10" />}
      </svg>
      {children}
    </div>
  )
}

export function SubmitButton({ loading, loadingText, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-volt px-6 font-body text-base font-extrabold text-noche transition-colors hover:bg-[#D8FF6A] disabled:cursor-wait disabled:opacity-70"
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-noche/30 border-t-noche" aria-hidden="true" />}
      {loading ? loadingText : children}
    </button>
  )
}
