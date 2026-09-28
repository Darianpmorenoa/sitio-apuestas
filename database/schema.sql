-- Crear tabla de usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  saldo DECIMAL(10, 2) DEFAULT 1000,
  es_admin BOOLEAN NOT NULL DEFAULT false, -- puede usar el panel /admin
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de equipos
CREATE TABLE equipos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  liga VARCHAR(50) NOT NULL,
  escudo VARCHAR(255),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de partidos
CREATE TABLE partidos (
  id SERIAL PRIMARY KEY,
  equipo_local_id INT REFERENCES equipos(id),
  equipo_visitante_id INT REFERENCES equipos(id),
  equipo_local VARCHAR(100),
  equipo_visitante VARCHAR(100),
  fecha TIMESTAMP NOT NULL,
  liga VARCHAR(50) NOT NULL,
  resultado VARCHAR(10),
  goles_local INT,
  goles_visitante INT,
  estado VARCHAR(20) DEFAULT 'pendiente' -- pendiente, finalizado, suspendido
);

-- Crear tabla de apuestas
CREATE TABLE apuestas (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  partido_id INT REFERENCES partidos(id),
  monto DECIMAL(10, 2) NOT NULL,
  prediccion VARCHAR(10) NOT NULL, -- 1 (local), X (empate), 2 (visitante)
  cuota DECIMAL(5, 2), -- cuota al momento de apostar
  ganancia DECIMAL(10, 2), -- ganancia neta al liquidar (negativa si se pierde)
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, ganada, perdida, anulada
  fecha_apuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_liquidacion TIMESTAMP
);

-- Insertar equipos de ejemplo (Primera División Chilena)
INSERT INTO equipos (nombre, liga) VALUES
('Colo-Colo', 'Primera División'),
('Universidad de Chile', 'Primera División'),
('Universidad Católica', 'Primera División'),
('Magallanes', 'Primera División'),
('Deportes Iquique', 'Primera División'),
('Ñublense', 'Primera División'),
('O''Higgins', 'Primera División'),
('Audax Italiano', 'Primera División'),
('Everton', 'Primera División'),
('Unión La Calera', 'Primera División'),
('Universidad de Concepción', 'Primera División'),
('Huachipato', 'Primera División'),
('Cobresal', 'Primera División'),
('Coquimbo Unido', 'Primera División'),
('Deportes La Serena', 'Primera División'),
('Deportes Concepción', 'Primera División'),
('Deportes Limache', 'Primera División'),
('Palestino', 'Primera División');

-- Insertar partidos de ejemplo
INSERT INTO partidos (equipo_local, equipo_visitante, fecha, liga, estado) VALUES
('Colo-Colo', 'Universidad de Chile', NOW() + INTERVAL '1 day', 'Primera División', 'pendiente'),
('Universidad Católica', 'Magallanes', NOW() + INTERVAL '2 days', 'Primera División', 'pendiente'),
('Ñublense', 'Audax Italiano', NOW() + INTERVAL '3 days', 'Primera División', 'pendiente'),
('Everton', 'O''Higgins', NOW() + INTERVAL '4 days', 'Primera División', 'pendiente'),
('Deportes Iquique', 'Unión La Calera', NOW() + INTERVAL '5 days', 'Primera División', 'pendiente');
