// src/modules/locations/city/city.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import { getCities, getCityOptions, getCityById, createCity, updateCity, updateCityFlags, uploadCityLogo, deleteCity } from './city.controller';

const router = Router();

// Every location-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('cities.view'), asyncHandler(getCities));
// Registered before /:id — otherwise Express would match "options" as
// the :id param and this route would never be reached.
router.get('/options', requirePermission('cities.view'), asyncHandler(getCityOptions));
router.get('/:id', requirePermission('cities.view'), asyncHandler(getCityById));

router.post(
  '/',
  requirePermission('cities.create'),
  imageUploader('cities').single('logo'),
  asyncHandler(createCity),
);
router.patch('/:id', requirePermission('cities.update'), asyncHandler(updateCity));
// Dedicated quick toggle route (Metro / Top city / Sell car enabled) for the row-level switches.
router.patch('/:id/flags', requirePermission('cities.update'), asyncHandler(updateCityFlags));

router.patch(
  '/:id/logo',
  requirePermission('cities.update'),
  imageUploader('cities').single('logo'),
  asyncHandler(uploadCityLogo),
);
router.delete('/:id', requirePermission('cities.delete'), asyncHandler(deleteCity));

export default router;