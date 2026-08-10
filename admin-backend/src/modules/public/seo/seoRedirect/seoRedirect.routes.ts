// src/modules/public/seo/seoRedirect/seoRedirect.routes.ts
//
// No requireAuth/requirePermission — public, unauthenticated. Short TTL
// (like site-setting's maintenance flag) so a newly added redirect goes
// live on the site quickly without needing a manual cache purge.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getActiveRedirects } from './seoRedirect.controller';

const router = Router();

router.get('/', publicCache(60), asyncHandler(getActiveRedirects));

export default router;
