// src/modules/public/search/search.routes.ts
//
// No requireAuth — public, unauthenticated API for the website's header
// search. Not cached (unlike most other public GETs) — every request
// must write its own search_logs row, so a cached response would silently
// under-count repeated identical searches.

import { Router } from 'express';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { searchCars } from './search.controller';

const router = Router();

router.get('/cars', asyncHandler(searchCars));

export default router;
