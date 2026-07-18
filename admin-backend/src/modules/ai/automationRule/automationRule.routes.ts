// src/modules/ai/automationRule/automationRule.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getAutomationRules,
  getAutomationRuleByFeature,
  upsertAutomationRule,
  toggleAutomationRule,
} from './automationRule.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('ai.automation-rules.view'), asyncHandler(getAutomationRules));
router.get('/:featureKey', requirePermission('ai.automation-rules.view'), asyncHandler(getAutomationRuleByFeature));
router.put('/:featureKey', requirePermission('ai.automation-rules.update'), asyncHandler(upsertAutomationRule));
router.patch(
  '/:featureKey/toggle',
  requirePermission('ai.automation-rules.update'),
  asyncHandler(toggleAutomationRule),
);

export default router;
