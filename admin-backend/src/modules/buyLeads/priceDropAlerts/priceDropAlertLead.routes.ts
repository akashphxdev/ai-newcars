// src/modules/buyLeads/priceDropAlerts/priceDropAlertLead.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getPriceDropAlertLeads,
  getPriceDropAlertLeadStats,
  getPriceDropAlertLeadById,
  updatePriceDropAlertLeadActive,
  addPriceDropAlertLeadActivity,
} from './priceDropAlertLead.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('leads.view'), asyncHandler(getPriceDropAlertLeads));
// Registered before /:id — otherwise Express would match "stats" as the
// :id param and this route would never be reached.
router.get('/stats', requirePermission('leads.view'), asyncHandler(getPriceDropAlertLeadStats));
router.get('/:id', requirePermission('leads.view'), asyncHandler(getPriceDropAlertLeadById));
router.patch('/:id/active', requirePermission('leads.moderate'), asyncHandler(updatePriceDropAlertLeadActive));
router.post('/:id/activity', requirePermission('leads.moderate'), asyncHandler(addPriceDropAlertLeadActivity));

export default router;
