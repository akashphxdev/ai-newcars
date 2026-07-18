// src/modules/role/role.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess } from '@/core/utils/sendResponse';
import { getClientIp } from '@/core/utils/getClientIp';
import * as roleService from './role.service';
import { createRoleSchema, updateRoleSchema, roleIdParamSchema } from './role.validation';

// GET /roles
export async function getRoles(_req: Request, res: Response) {
  const result = await roleService.listRoles();
  return sendSuccess(res, result, 'Roles fetched successfully');
}

// GET /roles/:id
export async function getRoleById(req: Request, res: Response) {
  const { id } = roleIdParamSchema.parse(req.params);
  const role = await roleService.getRoleById(id);
  return sendSuccess(res, role, 'Role fetched successfully');
}

// POST /roles
export async function createRole(req: Request, res: Response) {
  const input = createRoleSchema.parse(req.body);

  if (!req.auth) throw ApiError.unauthorized();

  const role = await roleService.createRole(input, req.auth.id, getClientIp(req));
  return sendSuccess(res, role, 'Role created successfully', 201);
}

// PATCH /roles/:id
export async function updateRole(req: Request, res: Response) {
  const { id } = roleIdParamSchema.parse(req.params);
  const input = updateRoleSchema.parse(req.body);

  if (!req.auth) throw ApiError.unauthorized();

  const role = await roleService.updateRole(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, role, 'Role updated successfully');
}

// DELETE /roles/:id
export async function deleteRole(req: Request, res: Response) {
  const { id } = roleIdParamSchema.parse(req.params);

  if (!req.auth) throw ApiError.unauthorized();

  const result = await roleService.deleteRole(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}