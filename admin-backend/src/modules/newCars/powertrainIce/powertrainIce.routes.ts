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

router.get('/', requirePermission('powertrainsice.view'), asyncHandler(getPowertrainIceList));
router.get('/:id', requirePermission('powertrainsice.view'), asyncHandler(getPowertrainIceById));
router.post('/', requirePermission('powertrainsice.create'), asyncHandler(createPowertrainIce));
router.patch('/:id/restore', requirePermission('powertrainsice.update'), asyncHandler(restorePowertrainIce));
router.patch('/:id', requirePermission('powertrainsice.update'), asyncHandler(updatePowertrainIce));
router.delete('/:id', requirePermission('powertrainsice.delete'), asyncHandler(deletePowertrainIce));

export default router;