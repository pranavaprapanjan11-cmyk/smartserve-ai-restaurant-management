// File: backend/src/server.ts
// Minimal Express server that mounts the auth routes.

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './modules/auth/auth.routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mount auth routes
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
