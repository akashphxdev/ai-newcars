// src/modules/sellLeads/scrapLeads/scrapLead.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getScrapLeads,
  getScrapLeadById,
  updateScrapLeadStatus,
  updateScrapLeadQuote,
  addScrapLeadActivity,
} from './scrapLead.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('leads.view'), asyncHandler(getScrapLeads));
router.get('/:id', requirePermission('leads.view'), asyncHandler(getScrapLeadById));
router.patch('/:id/status', requirePermission('leads.moderate'), asyncHandler(updateScrapLeadStatus));
router.patch('/:id/quote', requirePermission('leads.moderate'), asyncHandler(updateScrapLeadQuote));
router.post('/:id/activity', requirePermission('leads.moderate'), asyncHandler(addScrapLeadActivity));

export default router;
