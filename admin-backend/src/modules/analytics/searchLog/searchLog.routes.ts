// src/modules/analytics/searchLog/searchLog.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getSearchLogs, deleteSearchLog } from './searchLog.controller';

const router = Router();

// Every search-log route requires a logged-in admin. Rows themselves are
// written by the PUBLIC search endpoint (modules/public/search) — this
// module only reads/deletes them for the admin analytics view.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('search-logs.view'), asyncHandler(getSearchLogs));
router.delete('/:id', requirePermission('search-logs.delete'), asyncHandler(deleteSearchLog));

export default router;
