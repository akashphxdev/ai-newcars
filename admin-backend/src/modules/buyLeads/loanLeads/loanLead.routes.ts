// src/modules/buyLeads/loanLeads/loanLead.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getLoanLeads, getLoanLeadStats, getLoanLeadById, updateLoanLeadStatus, addLoanLeadActivity } from './loanLead.controller';

const router = Router();

// Every lead-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('leads.view'), asyncHandler(getLoanLeads));
// Registered before /:id — otherwise Express would match "stats" as the
// :id param (same convention as buyNewCarLead.routes.ts).
router.get('/stats', requirePermission('leads.view'), asyncHandler(getLoanLeadStats));
router.get('/:id', requirePermission('leads.view'), asyncHandler(getLoanLeadById));
router.patch('/:id/status', requirePermission('leads.moderate'), asyncHandler(updateLoanLeadStatus));
router.post('/:id/activity', requirePermission('leads.moderate'), asyncHandler(addLoanLeadActivity));

export default router;
