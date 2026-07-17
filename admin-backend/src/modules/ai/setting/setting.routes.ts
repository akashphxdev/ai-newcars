// src/modules/ai/setting/setting.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getAiSettings, upsertAiSettings, testAiConnection } from './setting.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('ai.settings.view'), asyncHandler(getAiSettings));
router.put('/', requirePermission('ai.settings.update'), asyncHandler(upsertAiSettings));
router.post('/test-connection', requirePermission('ai.settings.update'), asyncHandler(testAiConnection));

export default router;