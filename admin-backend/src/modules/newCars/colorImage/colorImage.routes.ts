// src/modules/newCars/colorImage/colorImage.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getModelsWithColorsOrImages } from './colorImage.controller';

const router = Router();

// Every color/image route requires a logged-in admin — same permission
// as browsing colors themselves.
router.use(requireAuth(['admin']));
router.get('/', requirePermission('colors.view'), asyncHandler(getModelsWithColorsOrImages));

export default router;
