import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  console.log('🔐 Verificando token...');
  console.log('Authorization header:', req.headers.authorization);

  if (!token) {
    console.log('❌ Token no proporcionado');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token válido, usuario:', decoded.id);
    req.user = decoded;
    console.log('➡️ Continuando al siguiente middleware/controlador...');
    next();
  } catch (error) {
    console.log('❌ Token inválido:', error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Va después de verifyToken. Consulta la base en cada petición para que quitar el rol tenga efecto inmediato.
export const requireAdmin = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT es_admin FROM usuarios WHERE id = $1', [req.user.id]);
    if (!rows[0]?.es_admin) {
      return res.status(403).json({ error: 'Solo los administradores pueden hacer esto' });
    }
    next();
  } catch (error) {
    console.error('Error al verificar el rol de administrador:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};
