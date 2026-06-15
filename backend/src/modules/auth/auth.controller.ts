// File: backend/src/modules/auth/auth.controller.ts
// Controller for auth routes: registration and login

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, verifyPassword } from './auth.service';
import { Role } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'please-set-a-secure-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user: { id: string; role: Role; email?: string }) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await createUser({ name, email, password, role });
    const token = signToken({ id: user.id, role: user.role, email: user.email });
    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('register error: failed to create user', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      body: req.body,
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      },
    });
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at };
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function me(req: Request, res: Response) {
  try {
    // req.user injected by auth middleware
    // Return currently authenticated user's basic info
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    return res.json({ user });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
