// src/modules/public/seo/seoMeta/seoMeta.routes.ts
//
// No requireAuth/requirePermission here — this is the public,
// unauthenticated API for the website. Cached 5 min, same as other
// mostly-static public GETs (e.g. brands, body-types).

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { publicCache } from '@/core/cache/publicCache';
import { getSeoMeta } from './seoMeta.controller';

const router = Router();

router.get('/', publicCache(300), asyncHandler(getSeoMeta));

export default router;
