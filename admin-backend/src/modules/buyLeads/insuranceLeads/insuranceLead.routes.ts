// src/modules/buyLeads/insuranceLeads/insuranceLead.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getInsuranceLeads,
  getInsuranceLeadById,
  updateInsuranceLeadStatus,
  addInsuranceLeadActivity,
} from './insuranceLead.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('leads.view'), asyncHandler(getInsuranceLeads));
router.get('/:id', requirePermission('leads.view'), asyncHandler(getInsuranceLeadById));
router.patch('/:id/status', requirePermission('leads.moderate'), asyncHandler(updateInsuranceLeadStatus));
router.post('/:id/activity', requirePermission('leads.moderate'), asyncHandler(addInsuranceLeadActivity));

export default router;
