// src/modules/newCars/powertrainIce/powertrainIce.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getPowertrainIceList,
  getPowertrainIceById,
  createPowertrainIce,
  updatePowertrainIce,
  restorePowertrainIce,
  deletePowertrainIce,
} from './powertrainIce.controller';

const router = Router();

// Every powertrain-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

// ICE powertrain lives under the existing "cars" permission module —
// same module Brand, CarModel, and Variant use (see MODULES in
// seedRbac.ts) — not a new module of its own.
router.get('/', requirePermission('cars.view'), asyncHandler(getPowertrainIceList));
router.get('/:id', requirePermission('cars.view'), asyncHandler(getPowertrainIceById));
router.post('/', requirePermission('cars.create'), asyncHandler(createPowertrainIce));
router.patch('/:id/restore', requirePermission('cars.update'), asyncHandler(restorePowertrainIce));
router.patch('/:id', requirePermission('cars.update'), asyncHandler(updatePowertrainIce));
router.delete('/:id', requirePermission('cars.delete'), asyncHandler(deletePowertrainIce));

export default router;