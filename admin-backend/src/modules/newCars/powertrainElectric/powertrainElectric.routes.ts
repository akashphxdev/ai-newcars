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
router.get('/', requirePermission('powertrainselectric.view'), asyncHandler(getPowertrainElectricList));
router.get('/:id', requirePermission('powertrainselectric.view'), asyncHandler(getPowertrainElectricById));
router.post('/', requirePermission('powertrainselectric.create'), asyncHandler(createPowertrainElectric));
router.patch('/:id/restore', requirePermission('powertrainselectric.update'), asyncHandler(restorePowertrainElectric));
router.patch('/:id', requirePermission('powertrainselectric.update'), asyncHandler(updatePowertrainElectric));
router.delete('/:id', requirePermission('powertrainselectric.delete'), asyncHandler(deletePowertrainElectric));

export default router;