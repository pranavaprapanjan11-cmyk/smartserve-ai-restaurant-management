// File: backend/src/server.ts
// Express server that mounts all module routes

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './modules/auth/auth.routes';
import menuRouter from './modules/menu/menu.routes';
import ordersRouter from './modules/orders/orders.routes';

const app = express();
app.use(cors());
app.use(express.json());

// Mount auth routes
app.use('/api/auth', authRouter);

// Mount menu routes
app.use('/api/menu', menuRouter);

// Mount orders routes
app.use('/api/orders', ordersRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
