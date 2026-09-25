import jwt from 'jsonwebtoken';

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
