import express from 'express';
import { crearGrupo, obtenerGrupos, obtenerGrupoDetalle, unirseAlGrupo, obtenerLinkWhatsApp } from '../controllers/grupos.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, crearGrupo);
router.get('/', verifyToken, obtenerGrupos);
router.get('/:id', verifyToken, obtenerGrupoDetalle);
router.post('/unirse', verifyToken, unirseAlGrupo);
router.get('/:id/whatsapp', verifyToken, obtenerLinkWhatsApp);

export default router;
