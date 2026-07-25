// src/modules/public/siteSetting/siteSetting.routes.ts
//
// No requireAuth/requirePermission here — the website's middleware
// polls this on every request to decide whether to show the
// maintenance page, so the cache TTL is deliberately short (30s) —
// long enough to absorb traffic, short enough that toggling
// maintenance mode in admin takes effect almost immediately.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getPublicSiteSettings } from './siteSetting.controller';

const router = Router();

router.get('/', publicCache(30), asyncHandler(getPublicSiteSettings));

export default router;
