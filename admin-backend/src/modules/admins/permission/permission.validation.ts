// src/modules/permission/permission.validation.ts

import { z } from 'zod';

// 'moderate'/'upload' added — reviews/leads.moderate and ai.image-pool.upload
// are real keys already checked by requirePermission() in the routes (see
// prisma/seed-site-settings-and-permissions.ts's PERMISSION_KEYS), but this
// enum didn't allow recreating them by hand.
const ACTIONS = ['view', 'create', 'update', 'delete', 'moderate', 'upload'] as const;

export const createPermissionSchema = z.object({
  module: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Module must be at least 2 characters')
    .max(50)
    // Hyphen added — modules like "ad-placements", "article-categories",
    // "story-groups" are real keys already in use (same reason as above).
    .regex(/^[a-z_-]+$/, 'Module must be lowercase letters/underscores/hyphens only (e.g. "leads", "ad-placements")'),
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