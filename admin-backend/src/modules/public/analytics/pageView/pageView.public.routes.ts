// src/modules/public/analytics/pageView/pageView.public.routes.ts
//
// No auth, no rate limiter — fires silently on every page load, guest or
// logged-in alike. A per-IP cap here would start dropping legitimate
// traffic during a normal browsing session, and the counter it writes to
// isn't tied to a user account anyway (see pageView.public.service.ts).

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { createPageView } from './pageView.public.controller';

const router = Router();

router.post('/', asyncHandler(createPageView));

export default router;
