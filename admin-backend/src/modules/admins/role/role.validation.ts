// src/modules/role/role.validation.ts

import { z } from 'zod';

export const roleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createRoleSchema = z.object({
  roleName: z.string().trim().min(2, 'Role name must be at least 2 characters').max(50),
  parentRoleId: z.coerce.number().int().positive().optional(),
  // Array of Permission row IDs to attach to this role.
  permissionIds: z.array(z.coerce.number().int().positive()).default([]),
});

export const updateRoleSchema = z
  .object({
    roleName: z.string().trim().min(2).max(50).optional(),
    permissionIds: z.array(z.coerce.number().int().positive()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export type CreateRoleParsed = z.infer<typeof createRoleSchema>;
export type UpdateRoleParsed = z.infer<typeof updateRoleSchema>;