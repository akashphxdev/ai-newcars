// src/modules/buyLeads/newCarLeads/buyNewCarLead.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getBuyNewCarLeads,
  getBuyNewCarLeadStats,
  getBuyNewCarLeadById,
  updateBuyNewCarLeadStatus,
  addBuyNewCarLeadActivity,
} from './buyNewCarLead.controller';

const router = Router();

// Every lead-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('leads.view'), asyncHandler(getBuyNewCarLeads));
// Registered before /:id — otherwise Express would match "stats" as the
// :id param and this route would never be reached (same convention as
// modules/locations/city/city.routes.ts's /options route).
router.get('/stats', requirePermission('leads.view'), asyncHandler(getBuyNewCarLeadStats));
router.get('/:id', requirePermission('leads.view'), asyncHandler(getBuyNewCarLeadById));
router.patch('/:id/status', requirePermission('leads.moderate'), asyncHandler(updateBuyNewCarLeadStatus));
router.post('/:id/activity', requirePermission('leads.moderate'), asyncHandler(addBuyNewCarLeadActivity));

export default router;
