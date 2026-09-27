import express from 'express';
import { listarPartidos, nuevoPartido, liquidar, anular } from '../controllers/admin.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, requireAdmin);

router.get('/partidos', listarPartidos);
router.post('/partidos', nuevoPartido);
router.post('/partidos/:id/liquidar', liquidar);
router.post('/partidos/:id/anular', anular);

export default router;
