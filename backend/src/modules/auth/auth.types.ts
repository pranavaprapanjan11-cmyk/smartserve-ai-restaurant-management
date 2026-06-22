// File: backend/src/modules/auth/auth.types.ts
// Types and role enums for the authentication module

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  CHEF = 'CHEF',
}

export function normalizeRole(role: string | undefined): Role | undefined {
  if (!role) return undefined;
  if (role === Role.KITCHEN_STAFF || role === Role.CHEF) return Role.CHEF;
  if (role === Role.RESTAURANT_OWNER || role === Role.OWNER) return Role.OWNER;
  if (role === Role.SUPER_ADMIN) return Role.SUPER_ADMIN;
  if (role === Role.MANAGER) return Role.MANAGER;
  if (role === Role.CASHIER) return Role.CASHIER;
  if (role === Role.WAITER) return Role.WAITER;
  return undefined;
}

export function storageRole(role: string | undefined): Role | undefined {
  const normalized = normalizeRole(role);
  if (normalized === Role.CHEF) return Role.KITCHEN_STAFF;
  if (normalized === Role.OWNER) return Role.RESTAURANT_OWNER;
  return normalized;
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

// Use explicit generics so `body` and `params` exist and are typed safely as `unknown`.
// Avoid using `any` to preserve strict typing.
export interface RequestWithUser extends Request<Record<string, unknown>, unknown, Record<string, unknown>> {
  user?: {
    id: string;
    role: Role;
    email?: string;
  };
}
