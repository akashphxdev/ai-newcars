// src/modules/admin/admin.validation.ts

import { z } from 'zod';

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // Rows-per-page, selectable from the UI. Capped at 100 to protect the
  // DB/API from someone requesting an unbounded page size.
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  isLocked: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'name', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const adminIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const mobileRegex = /^[0-9]{10,15}$/;

export const createAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(150),
  mobile: z.string().trim().regex(mobileRegex, 'Mobile must be 10-15 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  roleId: z.coerce.number().int().positive('roleId is required'),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  accessStartDate: z.coerce.date().optional(),
  accessEndDate: z.coerce.date().optional(),
});

export const updateAdminSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().toLowerCase().email().max(150).optional(),
    mobile: z.string().trim().regex(mobileRegex).optional(),
    roleId: z.coerce.number().int().positive().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
    accessStartDate: z.coerce.date().optional(),
    accessEndDate: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export const changeAdminPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const lockAdminSchema = z.object({
  reason: z.string().trim().max(255).optional(),
});

export const updateAdminStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended'], {
    message: 'status must be one of: active, inactive, suspended',
  }),
});

export type AdminListQueryParsed = z.infer<typeof adminListQuerySchema>;
export type CreateAdminParsed = z.infer<typeof createAdminSchema>;
export type UpdateAdminParsed = z.infer<typeof updateAdminSchema>;
export type UpdateAdminStatusParsed = z.infer<typeof updateAdminStatusSchema>;