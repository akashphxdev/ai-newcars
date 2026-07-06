// src/modules/admin/admin.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  updateAdminStatus,
  changeAdminPassword,
  lockAdmin,
  unlockAdmin,
  deactivateAdmin,
} from './admin.controller';

const router = Router();

// Every admin-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('alladmins.view'), asyncHandler(getAdmins));
router.get('/:id', requirePermission('alladmins.view'), asyncHandler(getAdminById));
router.post('/', requirePermission('alladmins.create'), asyncHandler(createAdmin));
router.patch('/:id', requirePermission('alladmins.update'), asyncHandler(updateAdmin));
// ADDED: dedicated quick status-toggle route (Active/Inactive/Suspended)
router.patch('/:id/status', requirePermission('alladmins.update'), asyncHandler(updateAdminStatus));
router.patch('/:id/password', requirePermission('alladmins.update'), asyncHandler(changeAdminPassword));
router.patch('/:id/lock', requirePermission('alladmins.update'), asyncHandler(lockAdmin));
router.patch('/:id/unlock', requirePermission('alladmins.update'), asyncHandler(unlockAdmin));
router.delete('/:id', requirePermission('alladmins.delete'), asyncHandler(deactivateAdmin));

export default router;