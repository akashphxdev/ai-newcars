// src/modules/ads/adClick/adClick.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getAdClicks, recordAdClick, deleteAdClick } from './adClick.controller';

const router = Router();

// Public — the consumer-facing site calls this whenever a visitor
// actually clicks an ad. Placed BEFORE requireAuth below so it stays
// unauthenticated, same convention as storyItem.routes.ts's
// PATCH /:id/view.
router.post('/', asyncHandler(recordAdClick));

// Every other click route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('ad-clicks.view'), asyncHandler(getAdClicks));
router.delete('/:id', requirePermission('ad-clicks.delete'), asyncHandler(deleteAdClick));

export default router;
