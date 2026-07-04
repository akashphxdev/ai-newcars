// src/modules/locations/city/city.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getCities, getCityById, createCity, updateCity, updateCityFlags, uploadCityLogo, deleteCity } from './city.controller';

const router = Router();

// Every location-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('locations.view'), asyncHandler(getCities));
router.get('/:id', requirePermission('locations.view'), asyncHandler(getCityById));

router.post(
  '/',
  requirePermission('locations.create'),
  imageUploader('cities').single('logo'),
  asyncHandler(createCity),
);
router.patch('/:id', requirePermission('locations.update'), asyncHandler(updateCity));
// Dedicated quick toggle route (Metro / Top city / Sell car enabled) for the row-level switches.
router.patch('/:id/flags', requirePermission('locations.update'), asyncHandler(updateCityFlags));

router.patch(
  '/:id/logo',
  requirePermission('locations.update'),
  imageUploader('cities').single('logo'),
  asyncHandler(uploadCityLogo),
);
router.delete('/:id', requirePermission('locations.delete'), asyncHandler(deleteCity));

export default router;