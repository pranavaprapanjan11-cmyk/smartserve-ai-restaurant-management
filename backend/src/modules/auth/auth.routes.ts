// File: backend/src/modules/auth/auth.routes.ts
// Express router for auth module

import { Router } from 'express';
import { register, login, me } from './auth.controller';
import { validateRegister, validateLogin } from './auth.validation';
import { authenticateJWT } from './auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegister, register);

// POST /api/auth/login
router.post('/login', validateLogin, login);

// GET /api/auth/me - returns current user
router.get('/me', authenticateJWT, me);

export default router;
