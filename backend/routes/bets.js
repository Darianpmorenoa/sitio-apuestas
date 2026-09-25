import express from 'express';
import { createBet, getUserBets, getBetById } from '../controllers/bets.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, createBet);
router.get('/', verifyToken, getUserBets);
router.get('/:id', verifyToken, getBetById);

export default router;
