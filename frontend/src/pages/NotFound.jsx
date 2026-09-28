import { Link } from 'react-router-dom'

// Se muestra para cualquier dirección que no coincide con una ruta del sitio
export default function NotFound() {
  return (
    <div className="min-h-screen bg-noche font-body text-tiza">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-4 pb-20 pt-8 sm:px-8 lg:pt-10 xl:px-12 2xl:px-20">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-linea-fuerte px-6 py-16 text-center">
          <p className="font-cifras text-sm font-bold text-volt">404</p>
          <h1 className="font-display text-4xl uppercase italic">Página no encontrada</h1>
          <p className="text-niebla">La dirección que buscas no existe o cambió de lugar.</p>
          <Link
            to="/"
            className="mt-3 flex h-12 items-center justify-center rounded-[14px] bg-volt px-5 text-sm font-extrabold text-noche transition-colors hover:bg-[#D8FF6A]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
