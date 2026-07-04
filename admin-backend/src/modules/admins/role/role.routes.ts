// src/modules/role/role.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getRoles, getRoleById, createRole, updateRole, deleteRole } from './role.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('roles.view'), asyncHandler(getRoles));
router.get('/:id', requirePermission('roles.view'), asyncHandler(getRoleById));
router.post('/', requirePermission('roles.create'), asyncHandler(createRole));
router.patch('/:id', requirePermission('roles.update'), asyncHandler(updateRole));
router.delete('/:id', requirePermission('roles.delete'), asyncHandler(deleteRole));

export default router;