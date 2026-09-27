import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Field, FormAlert } from '../components/AuthLayout'
import { groupInitials, groupTile } from '../utils/grupos'

const API = 'http://localhost:5000/api/grupos'

function PanelTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <h2 className="font-display text-3xl uppercase italic leading-none">{children}</h2>
    </div>
  )
}

const primaryButton =
  'flex items-center justify-center rounded-[14px] px-6 font-body text-[15px] font-extrabold transition-colors disabled:cursor-wait disabled:opacity-70'

export default function Grupos({ token }) {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: '', descripcion: '' })
  const [codigoUnirse, setCodigoUnirse] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [mensajeExito, setMensajeExito] = useState('')
  const [enviando, setEnviando] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchGrupos()
  }, [])

  useEffect(() => {
    if (!mensajeExito) return
    const timer = setTimeout(() => setMensajeExito(''), 4000)
    return () => clearTimeout(timer)
  }, [mensajeExito])

  const fetchGrupos = async () => {
    try {
      const response = await axios.get(API, { headers })
      setGrupos(response.data)
    } catch (err) {
      setError('Error al cargar los grupos')
    } finally {
      setLoading(false)
    }
  }

  const handleCrearGrupo = async (e) => {
    e.preventDefault()
    setError('')
    setMensajeExito('')

    if (!nuevoGrupo.nombre.trim()) {
      setFieldErrors({ nombre: 'El nombre del grupo es requerido' })
      return
    }
    setFieldErrors({})
    setEnviando('crear')

    try {
      await axios.post(API, { nombre: nuevoGrupo.nombre.trim(), descripcion: nuevoGrupo.descripcion.trim() }, { headers })
      setMensajeExito(`¡Grupo "${nuevoGrupo.nombre.trim()}" creado! Ábrelo para invitar a tus amigos.`)
      setNuevoGrupo({ nombre: '', descripcion: '' })
      fetchGrupos()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el grupo')
    } finally {
      setEnviando('')
    }
  }

  const handleUnirse = async (e) => {
    e.preventDefault()
    setError('')
    setMensajeExito('')

    if (!codigoUnirse.trim()) {
      setFieldErrors({ codigo: 'Ingresa el código de invitación' })
      return
    }
    setFieldErrors({})
    setEnviando('unirse')

    try {
      const response = await axios.post(`${API}/unirse`, { codigo: codigoUnirse.trim() }, { headers })
      setMensajeExito(`¡Te uniste a "${response.data.grupo?.nombre ?? 'el grupo'}"!`)
      setCodigoUnirse('')
      fetchGrupos()
    } catch (err) {
      setFieldErrors({ codigo: err.response?.data?.error || 'Error al unirse al grupo' })
    } finally {
      setEnviando('')
    }
  }

  return (
    <div className="min-h-screen bg-noche font-body text-tiza">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-9 px-4 pb-20 pt-10 sm:px-8 lg:pt-14 xl:px-12 2xl:px-20">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold tracking-[0.15em] text-gris">JUEGA CON TU GENTE</span>
          <h1 className="font-display text-5xl uppercase italic leading-[0.9] sm:text-7xl">Grupos</h1>
        </div>

        {error && <FormAlert>{error}</FormAlert>}
        {mensajeExito && <FormAlert tone="success">{mensajeExito}</FormAlert>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <form onSubmit={handleCrearGrupo} noValidate className="flex flex-col gap-4 rounded-3xl border border-linea bg-grada p-6 sm:p-7">
            <PanelTitle
              icon={
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-volt text-noche">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              }
            >
              Crear un grupo
            </PanelTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                id="grupo-nombre"
                label="Nombre del grupo"
                type="text"
                autoComplete="off"
                maxLength={100}
                placeholder="Ej: Los del Monumental"
                value={nuevoGrupo.nombre}
                onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })}
                error={fieldErrors.nombre}
                disabled={enviando === 'crear'}
              />
              <Field
                id="grupo-descripcion"
                label="Descripción (opcional)"
                type="text"
                autoComplete="off"
                placeholder="¿De qué se trata?"
                value={nuevoGrupo.descripcion}
                onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, descripcion: e.target.value })}
                disabled={enviando === 'crear'}
              />
            </div>
            <button type="submit" disabled={enviando === 'crear'} className={`${primaryButton} h-[52px] self-start bg-volt text-noche hover:bg-[#D8FF6A]`}>
              {enviando === 'crear' ? 'Creando...' : 'Crear grupo'}
            </button>
          </form>

          <form onSubmit={handleUnirse} noValidate className="flex flex-col gap-4 rounded-3xl border border-linea bg-grada p-6 sm:p-7">
            <PanelTitle
              icon={
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-linea-fuerte bg-pasto text-volt">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="m10 17 5-5-5-5" /><path d="M15 12H3" /></svg>
                </span>
              }
            >
              Unirme con código
            </PanelTitle>
            <Field id="grupo-codigo" label="Código de invitación" error={fieldErrors.codigo}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="grupo-codigo"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="GRPXXXXXXXX"
                  value={codigoUnirse}
                  onChange={(e) => setCodigoUnirse(e.target.value.toUpperCase())}
                  aria-invalid={fieldErrors.codigo ? true : undefined}
                  aria-describedby={fieldErrors.codigo ? 'grupo-codigo-error' : undefined}
                  disabled={enviando === 'unirse'}
                  className={`h-14 w-full min-w-0 max-w-none flex-1 rounded-[14px] border bg-[#0A0E14] px-4 font-cifras text-lg font-bold uppercase tracking-[0.2em] text-tiza outline-none placeholder:tracking-[0.2em] placeholder:text-gris/50 focus:border-volt focus:ring-[3px] focus:ring-[#26330C] ${fieldErrors.codigo ? 'border-[#FF5C6C]' : 'border-[#2A3545]'}`}
                />
                <button type="submit" disabled={enviando === 'unirse'} className={`${primaryButton} h-14 bg-tiza text-noche hover:bg-white`}>
                  {enviando === 'unirse' ? 'Uniendo...' : 'Unirme'}
                </button>
              </div>
            </Field>
            <p className="text-[13px] text-gris">Pídele el código a alguien del grupo. Lo encuentra en la página del grupo.</p>
          </form>
        </div>

        <section className="flex flex-col gap-5" aria-labelledby="mis-grupos">
          <h2 id="mis-grupos" className="font-display text-4xl uppercase italic leading-none">
            Mis grupos {!loading && <span className="text-linea-fuerte">{grupos.length}</span>}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
              {[0, 1, 2].map(i => <div key={i} className="h-60 animate-pulse rounded-3xl bg-grada" />)}
            </div>
          ) : grupos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-linea-fuerte px-6 py-14 text-center">
              <h3 className="font-display text-3xl uppercase italic">Aún no tienes grupos</h3>
              <p className="max-w-md text-niebla">Crea uno arriba e invita a tus amigos, o únete con el código que te compartieron.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {grupos.map(grupo => (
                <Link
                  key={grupo.id}
                  to={`/grupos/${grupo.id}`}
                  className="group flex flex-col gap-5 rounded-3xl border border-linea bg-grada p-6 text-tiza no-underline transition-colors hover:border-linea-fuerte"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl font-display text-2xl italic ${groupTile(grupo.id)}`}>
                      {groupInitials(grupo.nombre)}
                    </span>
                    <span className="flex h-7 items-center rounded-full border border-[#2A3545] bg-pasto px-3 text-[11px] font-extrabold uppercase tracking-wider text-niebla">
                      {grupo.mi_rol === 'admin' ? 'Admin' : 'Miembro'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <h3 className="font-display text-3xl uppercase italic leading-none">{grupo.nombre}</h3>
                    <p className="text-sm text-gris">{grupo.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-linea pt-4 text-[13px]">
                    <span className="font-bold text-niebla">
                      {grupo.total_miembros ?? '—'} {grupo.total_miembros === 1 ? 'miembro' : 'miembros'}
                    </span>
                    <span className="flex items-center gap-2 font-bold text-volt">
                      Ver grupo
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
