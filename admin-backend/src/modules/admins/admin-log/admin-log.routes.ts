// src/modules/admin-log/admin-log.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getAdminLogs } from './admin-log.controller';

const router = Router();

router.use(requireAuth(['admin']));
router.get('/', requirePermission('admins.view'), asyncHandler(getAdminLogs));

export default router;