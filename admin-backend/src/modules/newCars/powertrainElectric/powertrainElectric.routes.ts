// src/modules/newCars/powertrainElectric/powertrainElectric.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getPowertrainElectricList,
  getPowertrainElectricById,
  createPowertrainElectric,
  updatePowertrainElectric,
  restorePowertrainElectric,
  deletePowertrainElectric,
} from './powertrainElectric.controller';

const router = Router();

// Every powertrain-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

// Electric powertrain lives under the existing "cars" permission module —
// same module Brand, CarModel, Variant, and PowertrainIce use (see
// MODULES in seedRbac.ts) — not a new module of its own.
router.get('/', requirePermission('cars.view'), asyncHandler(getPowertrainElectricList));
router.get('/:id', requirePermission('cars.view'), asyncHandler(getPowertrainElectricById));
router.post('/', requirePermission('cars.create'), asyncHandler(createPowertrainElectric));
router.patch('/:id/restore', requirePermission('cars.update'), asyncHandler(restorePowertrainElectric));
router.patch('/:id', requirePermission('cars.update'), asyncHandler(updatePowertrainElectric));
router.delete('/:id', requirePermission('cars.delete'), asyncHandler(deletePowertrainElectric));

export default router;