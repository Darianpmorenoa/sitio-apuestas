import { Link } from 'react-router-dom'

export default function Footer() {
  const linkClass = 'text-niebla no-underline transition-colors hover:text-tiza'
  return (
    <footer className="border-t border-[#161E2A] bg-noche font-body text-[13px] text-gris">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 xl:px-10">
        <span>Apuestas virtuales, sin dinero real. Solo con fines de entretenimiento.</span>
        <nav aria-label="Legal" className="flex gap-6">
          <Link to="/terminos" className={linkClass}>Términos</Link>
          <Link to="/privacidad" className={linkClass}>Privacidad</Link>
          <Link to="/estadisticas" className={linkClass}>Estadísticas</Link>
        </nav>
      </div>
    </footer>
  )
}
