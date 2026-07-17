// src/modules/ai/log/aiLog.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getAiLogs } from './aiLog.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('ai.logs.view'), asyncHandler(getAiLogs));

export default router;