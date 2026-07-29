// File: backend/src/server.ts
// Express server that mounts all module routes

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import authRouter from './modules/auth/auth.routes';
import menuRouter from './modules/menu/menu.routes';
import ordersRouter from './modules/orders/orders.routes';
import kitchenRouter from './modules/kitchen/kitchen.routes';
import billingRouter from './modules/billing/billing.routes';
import settingsRouter from './modules/settings/settings.routes';
import inventoryRouter from './modules/inventory/inventory.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import aiRouter from './modules/ai/ai.routes';
import employeesRouter from './modules/employees/employees.controller';
import tablesRouter from './modules/tables/tables.routes';
import aiOperationsRouter from './modules/ai-operations/aiOperations.routes';
import crmRouter from './modules/crm/crm.routes';
import workspaceRouter from './modules/workspace/workspace.routes';
import aiImportRouter from './modules/ai-import/aiImport.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

// Mount auth routes
app.use('/api/auth', authRouter);

// Mount menu routes
app.use('/api/menu', menuRouter);

// Mount orders routes
app.use('/api/orders', ordersRouter);

// Mount kitchen routes
app.use('/api/kitchen', kitchenRouter);

// Mount billing routes
app.use('/api/billing', billingRouter);

// Mount inventory routes
app.use('/api/inventory', inventoryRouter);

// Mount analytics routes
app.use('/api/analytics', analyticsRouter);

// Mount AI intelligence routes
app.use('/api/ai', aiRouter);

// Mount employees routes
app.use('/api/restaurants', employeesRouter);

// Mount settings routes
app.use('/api/settings', settingsRouter);

// Mount tables routes
app.use('/api/tables', tablesRouter);

// Mount AI operations routes
app.use('/api/ai-operations', aiOperationsRouter);

// Mount CRM routes
app.use('/api/crm', crmRouter);

// Mount Workspace routes
app.use('/api/workspace', workspaceRouter);

// Mount AI Import routes
app.use('/api/ai-import', aiImportRouter);

import { sseHandler } from './modules/workspace/workspace.sse';

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Workspace updates endpoint
app.get('/api/workspace/updates', sseHandler);

// Global Error Handler guaranteeing JSON responses across all status codes
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Global Error Handler]', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
