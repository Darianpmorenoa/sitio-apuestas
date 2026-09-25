import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import matchesRoutes from './routes/matches.js';
import betsRoutes from './routes/bets.js';
import gruposRoutes from './routes/grupos.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/grupos', gruposRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Servidor de apuestas deportivas funcionando ✅' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
