// src/modules/users/user/user.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { getClientIp } from '@/core/utils/getClientIp';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import * as userService from './user.service';
import {
  userListQuerySchema,
  userIdParamSchema,
  updateUserStatusSchema,
  lockUserSchema,
} from './user.validation';

// GET /users
export async function getUsers(req: Request, res: Response) {
  const query = userListQuerySchema.parse(req.query);
  const result = await userService.listUsers(query);
  return sendPaginated(res, result.items, result.pagination, 'Users fetched successfully', {
    newToday: result.newToday,
  });
}

// GET /users/:id
export async function getUserById(req: Request, res: Response) {
  const { id } = userIdParamSchema.parse(req.params);
  const user = await userService.getUserById(id);
  return sendSuccess(res, user, 'User fetched successfully');
}

// PATCH /users/:id/status
export async function updateUserStatus(req: Request, res: Response) {
  const { id } = userIdParamSchema.parse(req.params);
  const { status } = updateUserStatusSchema.parse(req.body);

  if (!req.auth) throw ApiError.unauthorized();

  const user = await userService.updateUserStatus(id, status, req.auth.id, getClientIp(req));
  return sendSuccess(res, user, 'User status updated successfully');
}

// PATCH /users/:id/lock
export async function lockUser(req: Request, res: Response) {
  const { id } = userIdParamSchema.parse(req.params);
  const { reason } = lockUserSchema.parse(req.body);

  if (!req.auth) throw ApiError.unauthorized();

  const user = await userService.lockUser(id, req.auth.id, reason, getClientIp(req));
  return sendSuccess(res, user, 'User locked successfully');
}

// PATCH /users/:id/unlock
export async function unlockUser(req: Request, res: Response) {
  const { id } = userIdParamSchema.parse(req.params);

  if (!req.auth) throw ApiError.unauthorized();

  const user = await userService.unlockUser(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, user, 'User unlocked successfully');
}

// DELETE /users/:id (soft delete -> status = inactive)
export async function deleteUser(req: Request, res: Response) {
  const { id } = userIdParamSchema.parse(req.params);

  if (!req.auth) throw ApiError.unauthorized();

  const user = await userService.deleteUser(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, user, 'User deactivated successfully');
}
