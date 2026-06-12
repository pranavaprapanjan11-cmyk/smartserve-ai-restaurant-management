// File: backend/src/modules/auth/auth.types.ts
// Types and role enums for the authentication module

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface NewUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

import { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    role: Role;
    email?: string;
  };
}
