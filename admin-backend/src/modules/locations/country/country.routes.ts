// src/modules/locations/country/country.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getCountries,
  getCountryById,
  createCountry,
  updateCountry,
  updateCountryStatus,
  deleteCountry,
} from './country.controller';

const router = Router();

// Every location-management route requires a logged-in admin.
router.use(requireAuth(['admin']));

router.get('/', requirePermission('countries.view'), asyncHandler(getCountries));
router.get('/:id', requirePermission('countries.view'), asyncHandler(getCountryById));
router.post('/', requirePermission('countries.create'), asyncHandler(createCountry));
router.patch('/:id', requirePermission('countries.update'), asyncHandler(updateCountry));
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
router.patch('/:id/status', requirePermission('countries.update'), asyncHandler(updateCountryStatus));
router.delete('/:id', requirePermission('countries.delete'), asyncHandler(deleteCountry));

export default router;