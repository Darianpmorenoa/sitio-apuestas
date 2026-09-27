// Ficha con iniciales y color de cada grupo (el color se elige por su id)
const TILE_COLORS = ['bg-volt text-noche', 'bg-ambar text-noche', 'bg-[#3DDCFF] text-noche', 'bg-[#D9CCFF] text-noche']

export const groupInitials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'G'

export const groupTile = (id) => TILE_COLORS[(Number(id) || 0) % TILE_COLORS.length]
