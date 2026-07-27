// src/modules/users/user/user.validation.ts

import { z } from 'zod';

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  isLocked: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'name', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended'], {
    message: 'status must be one of: active, inactive, suspended',
  }),
});

export const lockUserSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export type UserListQueryParsed = z.infer<typeof userListQuerySchema>;
export type UpdateUserStatusParsed = z.infer<typeof updateUserStatusSchema>;
export type LockUserParsed = z.infer<typeof lockUserSchema>;
