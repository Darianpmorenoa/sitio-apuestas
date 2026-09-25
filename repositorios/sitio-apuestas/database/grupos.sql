-- Tabla de grupos de apuestas
CREATE TABLE grupos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  creador_id INT REFERENCES usuarios(id),
  codigo_invitacion VARCHAR(50) UNIQUE NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT true
);

-- Tabla de miembros del grupo
CREATE TABLE miembros_grupo (
  id SERIAL PRIMARY KEY,
  grupo_id INT REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  rol VARCHAR(20) DEFAULT 'miembro', -- 'admin', 'miembro'
  fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grupo_id, usuario_id)
);

-- Tabla de apuestas compartidas en grupo
CREATE TABLE apuestas_grupo (
  id SERIAL PRIMARY KEY,
  grupo_id INT REFERENCES grupos(id) ON DELETE CASCADE,
  apuesta_id INT REFERENCES apuestas(id),
  fecha_compartida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserts de ejemplo
INSERT INTO grupos (nombre, descripcion, creador_id, codigo_invitacion) VALUES
(
  'Los Campeones',
  'Grupo de amigos que apuestan juntos',
  1,
  'GRP' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)
);

INSERT INTO miembros_grupo (grupo_id, usuario_id, rol) VALUES
(1, 1, 'admin');
