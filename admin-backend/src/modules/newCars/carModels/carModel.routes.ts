// src/modules/newCars/carModels/carModel.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getCarModels,
  getCarModelById,
  createCarModel,
  updateCarModel,
  updateCarModelLaunchStatus,
  deleteCarModel,
} from './carModel.controller';

const router = Router();

// Every car-model-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

// Car model lives under the existing "cars" permission module — same
// module Brand uses (see MODULES in seedRbac.ts) — not a new module of its own.
router.get('/', requirePermission('cars.view'), asyncHandler(getCarModels));
router.get('/:id', requirePermission('cars.view'), asyncHandler(getCarModelById));
router.post('/', requirePermission('cars.create'), asyncHandler(createCarModel));
router.patch('/:id', requirePermission('cars.update'), asyncHandler(updateCarModel));
// Dedicated quick launch-status-change route for the row-level select.
router.patch('/:id/launch-status', requirePermission('cars.update'), asyncHandler(updateCarModelLaunchStatus));
router.delete('/:id', requirePermission('cars.delete'), asyncHandler(deleteCarModel));

export default router;