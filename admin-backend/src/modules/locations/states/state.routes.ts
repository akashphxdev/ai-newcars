// src/modules/locations/state/state.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getStates, getStateById, createState, updateState, deleteState } from './state.controller';

const router = Router();

// Every location-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('states.view'), asyncHandler(getStates));
router.get('/:id', requirePermission('states.view'), asyncHandler(getStateById));
router.post('/', requirePermission('states.create'), asyncHandler(createState));
router.patch('/:id', requirePermission('states.update'), asyncHandler(updateState));
router.delete('/:id', requirePermission('states.delete'), asyncHandler(deleteState));

export default router;