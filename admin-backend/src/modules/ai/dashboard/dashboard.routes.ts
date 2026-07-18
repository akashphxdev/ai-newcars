// src/modules/ai/dashboard/dashboard.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getDashboardSummary } from './dashboard.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('ai.dashboard.view'), asyncHandler(getDashboardSummary));

export default router;
