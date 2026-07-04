// src/modules/admin/admin.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { getClientIp } from '@/core/utils/getClientIp';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as adminService from './admin.service';
import {
  adminListQuerySchema,
  adminIdParamSchema,
  createAdminSchema,
  updateAdminSchema,
  changeAdminPasswordSchema,
  lockAdminSchema,
  updateAdminStatusSchema,
} from './admin.validation';

// GET /admins
export async function getAdmins(req: Request, res: Response) {
  const query = adminListQuerySchema.parse(req.query);
  const result = await adminService.listAdmins(query);
  return sendPaginated(res, result.items, result.pagination, 'Admins fetched successfully');
}

// GET /admins/:id
export async function getAdminById(req: Request, res: Response) {
  const { id } = adminIdParamSchema.parse(req.params);
  const admin = await adminService.getAdminById(id);
  return sendSuccess(res, admin, 'Admin fetched successfully');
}

// POST /admins
export async function createAdmin(req: Request, res: Response) {
  const input = createAdminSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const admin = await adminService.createAdmin(input, req.auth.id);
  return sendSuccess(res, admin, 'Admin created successfully', 201);
}

// PATCH /admins/:id
export async function updateAdmin(req: Request, res: Response) {
  const { id } = adminIdParamSchema.parse(req.params);
  const input = updateAdminSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const admin = await adminService.updateAdmin(id, input, req.auth.id);
  return sendSuccess(res, admin, 'Admin updated successfully');
}

// ADDED: PATCH /admins/:id/status
// Lightweight endpoint for the row-level status toggle on the admin
// listing page — doesn't require sending the full edit payload.
export async function updateAdminStatus(req: Request, res: Response) {
  const { id } = adminIdParamSchema.parse(req.params);
  const { status } = updateAdminStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const admin = await adminService.updateAdminStatus(id, status, req.auth.id, getClientIp(req));
  return sendSuccess(res, admin, 'Admin status updated successfully');
}

// PATCH /admins/:id/password
export async function changeAdminPassword(req: Request, res: Response) {
  const { id } = adminIdParamSchema.parse(req.params);
  const { newPassword } = changeAdminPasswordSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await adminService.changeAdminPassword(id, newPassword, req.auth.id);
  return sendSuccess(res, null, result.message);
}

// PATCH /admins/:id/lock
export async function lockAdmin(req: Request, res: Response) {
  const { id } = adminIdParamSchema.parse(req.params);
  const { reason } = lockAdminSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const admin = await adminService.lockAdmin(id, req.auth.id, reason);
  return sendSuccess(res, admin, 'Admin locked successfully');
}

// PATCH /admins/:id/unlock
export async function unlockAdmin(req: Request, res: Response) {
  const { id } = adminIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const admin = await adminService.unlockAdmin(id, req.auth.id);
  return sendSuccess(res, admin, 'Admin unlocked successfully');
}

// DELETE /admins/:id  (soft delete -> status = inactive)
export async function deactivateAdmin(req: Request, res: Response) {
  const { id } = adminIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const admin = await adminService.deactivateAdmin(id, req.auth.id);
  return sendSuccess(res, admin, 'Admin deactivated successfully');
}