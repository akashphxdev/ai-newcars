// src/modules/home/testimonial/testimonial.routes.ts

import { Router } from 'express';
import { requireAuth } from '@/core/middleware/auth';
import { requirePermission } from '@/core/middleware/requirePermission';
import { imageUploader } from '@/core/middleware/upload.middleware';
import { asyncHandler } from '@/core/utils/asyncHandler';
import {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  updateTestimonialStatus,
  updateTestimonialActive,
  uploadTestimonialPhoto,
  deleteTestimonial,
} from './testimonial.controller';

const router = Router();

router.use(requireAuth(['admin']));

router.get('/', requirePermission('testimonials.view'), asyncHandler(getTestimonials));
router.get('/:id', requirePermission('testimonials.view'), asyncHandler(getTestimonialById));
// Photo is optional — imageUploader still applies (no video allowed
// for a customer photo), but a request with no file is valid too.
router.post(
  '/',
  requirePermission('testimonials.create'),
  imageUploader('testimonials').single('photo'),
  asyncHandler(createTestimonial),
);
router.patch('/:id', requirePermission('testimonials.update'), asyncHandler(updateTestimonial));
// Moderation route — approve/reject from the review queue.
router.patch('/:id/status', requirePermission('testimonials.update'), asyncHandler(updateTestimonialStatus));
// Dedicated quick Active/Inactive toggle for the row-level switch.
router.patch('/:id/active', requirePermission('testimonials.update'), asyncHandler(updateTestimonialActive));
// Dedicated photo-replace route — main PATCH /:id above stays JSON-only.
router.patch(
  '/:id/photo',
  requirePermission('testimonials.update'),
  imageUploader('testimonials').single('photo'),
  asyncHandler(uploadTestimonialPhoto),
);
router.delete('/:id', requirePermission('testimonials.delete'), asyncHandler(deleteTestimonial));

export default router;
