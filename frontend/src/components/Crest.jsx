import { teamStyle } from '../utils/futbol'

// Escudo circular con las iniciales y los colores del club
export default function Crest({ name, className = 'h-8 w-8 text-xs' }) {
  const { abbr, bg, fg } = teamStyle(name)
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-display not-italic ${className}`}
      style={{ backgroundColor: bg, color: fg }}
      aria-hidden="true"
    >
      {abbr}
    </span>
  )
}
