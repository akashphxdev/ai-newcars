// src/modules/buyLeads/softLeads/softLead.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getSoftLeads, getSoftLeadStats, getSoftLeadById, updateSoftLeadStatus, addSoftLeadActivity } from './softLead.controller';

const router = Router();

// Every lead-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('leads.view'), asyncHandler(getSoftLeads));
// Registered before /:id — otherwise Express would match "stats" as the
// :id param (same convention as buyNewCarLead.routes.ts).
router.get('/stats', requirePermission('leads.view'), asyncHandler(getSoftLeadStats));
router.get('/:id', requirePermission('leads.view'), asyncHandler(getSoftLeadById));
router.patch('/:id/status', requirePermission('leads.moderate'), asyncHandler(updateSoftLeadStatus));
router.post('/:id/activity', requirePermission('leads.moderate'), asyncHandler(addSoftLeadActivity));

export default router;
