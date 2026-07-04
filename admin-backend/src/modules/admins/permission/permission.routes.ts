// src/modules/permission/permission.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getPermissions, createPermission, deletePermission } from './permission.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('permissions.view'), asyncHandler(getPermissions));
router.post('/', requirePermission('permissions.create'), asyncHandler(createPermission));
router.delete('/:id', requirePermission('permissions.delete'), asyncHandler(deletePermission));

export default router;