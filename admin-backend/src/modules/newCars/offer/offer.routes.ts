// src/modules/newCars/offer/offer.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  updateOfferStatus,
  uploadOfferImage,
  deleteOffer,
} from './offer.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('offers.view'), asyncHandler(getOffers));
router.get('/:id', requirePermission('offers.view'), asyncHandler(getOfferById));
router.post(
  '/',
  requirePermission('offers.create'),
  imageUploader('offers').single('image'),
  asyncHandler(createOffer),
);
router.patch('/:id', requirePermission('offers.update'), asyncHandler(updateOffer));
// Dedicated quick status-toggle route (Active/Inactive) for the row-level switch.
router.patch('/:id/status', requirePermission('offers.update'), asyncHandler(updateOfferStatus));
// Dedicated image-replace route — main PATCH /:id above stays JSON-only.
router.patch(
  '/:id/image',
  requirePermission('offers.update'),
  imageUploader('offers').single('image'),
  asyncHandler(uploadOfferImage),
);
router.delete('/:id', requirePermission('offers.delete'), asyncHandler(deleteOffer));

export default router;