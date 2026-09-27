-- Migración 002: rol de administrador
-- Se puede ejecutar más de una vez sin problemas.

-- Los administradores pueden cargar partidos y registrar marcadores desde /admin.
-- Para dar o quitar el rol:  npm run admin -- <email>  /  npm run admin -- <email> --quitar  (desde backend/)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_admin BOOLEAN NOT NULL DEFAULT false;
