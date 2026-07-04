// src/modules/permission/permission.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess } from '@/core/utils/sendResponse';
import * as permissionService from './permission.service';
import {
  createPermissionSchema,
  permissionIdParamSchema,
  permissionListQuerySchema,
} from './permission.validation';

// GET /permissions
export async function getPermissions(req: Request, res: Response) {
  const query = permissionListQuerySchema.parse(req.query);
  const result = await permissionService.listPermissions(query);
  return sendSuccess(res, result, 'Permissions fetched successfully');
}

// POST /permissions
export async function createPermission(req: Request, res: Response) {
  const input = createPermissionSchema.parse(req.body);

  if (!req.auth) throw ApiError.unauthorized();

  const permission = await permissionService.createPermission(input, req.auth.id);
  return sendSuccess(res, permission, 'Permission created successfully', 201);
}

// DELETE /permissions/:id
export async function deletePermission(req: Request, res: Response) {
  const { id } = permissionIdParamSchema.parse(req.params);

  if (!req.auth) throw ApiError.unauthorized();

  const result = await permissionService.deletePermission(id, req.auth.id);
  return sendSuccess(res, null, result.message);
}