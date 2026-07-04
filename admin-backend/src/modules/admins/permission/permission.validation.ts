// src/modules/permission/permission.validation.ts

import { z } from 'zod';

const ACTIONS = ['view', 'create', 'update', 'delete'] as const; // CHANGED: lock/export/approve hataye

export const createPermissionSchema = z.object({
  module: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Module must be at least 2 characters')
    .max(50)
    .regex(/^[a-z_]+$/, 'Module must be lowercase letters/underscores only (e.g. "leads", "admins")'),
  action: z.enum(ACTIONS, { message: `Action must be one of: ${ACTIONS.join(', ')}` }),
});

export const permissionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const permissionListQuerySchema = z.object({
  module: z.string().trim().toLowerCase().optional(),
});

export type CreatePermissionParsed = z.infer<typeof createPermissionSchema>;
export type PermissionListQueryParsed = z.infer<typeof permissionListQuerySchema>;