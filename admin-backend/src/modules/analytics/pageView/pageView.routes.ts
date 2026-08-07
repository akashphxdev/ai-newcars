// src/modules/analytics/pageView/pageView.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getPageViewSummary } from './pageView.controller';

const router = Router();

// Every page-view route requires a logged-in admin. The counters
// themselves are written by the PUBLIC analytics endpoint
// (modules/public/analytics/pageView) — this module only reads the
// aggregated trend/top-pages summary for the admin dashboard.
router.use(requireAuth(['admin']));

router.get('/summary', requirePermission('page-views.view'), asyncHandler(getPageViewSummary));

export default router;
