// src/modules/users/user/user.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getUsers, getUserById, updateUserStatus, lockUser, unlockUser, deleteUser } from './user.controller';

const router = Router();

// Every user-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('users.view'), asyncHandler(getUsers));
router.get('/:id', requirePermission('users.view'), asyncHandler(getUserById));
router.patch('/:id/status', requirePermission('users.update'), asyncHandler(updateUserStatus));
router.patch('/:id/lock', requirePermission('users.update'), asyncHandler(lockUser));
router.patch('/:id/unlock', requirePermission('users.update'), asyncHandler(unlockUser));
router.delete('/:id', requirePermission('users.delete'), asyncHandler(deleteUser));

export default router;
