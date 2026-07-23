// src/modules/siteSetting/siteSetting.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getSiteSettings, upsertSiteSettings } from './siteSetting.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('site.settings.view'), asyncHandler(getSiteSettings));
router.put('/', requirePermission('site.settings.update'), asyncHandler(upsertSiteSettings));

export default router;