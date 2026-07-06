// src/modules/newCars/offer/offer.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
} from './offer.controller';

const router = Router();

// Every offer-management route requires a logged-in admin.
router.use(requireAuth(['admin']));
router.get('/', requirePermission('offers.view'), asyncHandler(getOffers));
router.get('/:id', requirePermission('offers.view'), asyncHandler(getOfferById));
router.post('/', requirePermission('offers.create'), asyncHandler(createOffer));
router.patch('/:id', requirePermission('offers.update'), asyncHandler(updateOffer));
router.delete('/:id', requirePermission('offers.delete'), asyncHandler(deleteOffer));

export default router;