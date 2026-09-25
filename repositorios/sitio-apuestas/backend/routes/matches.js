import express from 'express';
import { getAllMatches, getMatchById, getMatchResults } from '../controllers/matches.js';

const router = express.Router();

router.get('/', getAllMatches);
router.get('/resultados/historial', getMatchResults);
router.get('/:id', getMatchById);

export default router;
