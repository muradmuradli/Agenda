import { Role } from '../generated/prisma/enums.js';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  role: Role;
  jti?: string;
}

export type AuthenticatedRequest = Request & { user?: AuthUser };
