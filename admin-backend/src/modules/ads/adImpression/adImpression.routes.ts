// src/modules/ads/adImpression/adImpression.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getAdImpressions, recordAdImpression, deleteAdImpression } from './adImpression.controller';

const router = Router();

// Public — the consumer-facing site calls this whenever a visitor
// actually sees an ad render. Placed BEFORE requireAuth below so it
// stays unauthenticated, same convention as storyItem.routes.ts's
// PATCH /:id/view.
router.post('/', asyncHandler(recordAdImpression));

// Every other impression route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('ad-impressions.view'), asyncHandler(getAdImpressions));
router.delete('/:id', requirePermission('ad-impressions.delete'), asyncHandler(deleteAdImpression));

export default router;
