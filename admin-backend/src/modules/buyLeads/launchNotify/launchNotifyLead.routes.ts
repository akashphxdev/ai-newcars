// src/modules/buyLeads/launchNotify/launchNotifyLead.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getLaunchNotifyLeads,
  getLaunchNotifyLeadStats,
  getLaunchNotifyLeadById,
  updateLaunchNotifyLeadActive,
  addLaunchNotifyLeadActivity,
} from './launchNotifyLead.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('leads.view'), asyncHandler(getLaunchNotifyLeads));
// Registered before /:id — otherwise Express would match "stats" as the
// :id param and this route would never be reached.
router.get('/stats', requirePermission('leads.view'), asyncHandler(getLaunchNotifyLeadStats));
router.get('/:id', requirePermission('leads.view'), asyncHandler(getLaunchNotifyLeadById));
router.patch('/:id/active', requirePermission('leads.moderate'), asyncHandler(updateLaunchNotifyLeadActive));
router.post('/:id/activity', requirePermission('leads.moderate'), asyncHandler(addLaunchNotifyLeadActivity));

export default router;
