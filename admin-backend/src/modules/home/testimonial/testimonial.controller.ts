// src/modules/home/testimonial/testimonial.controller.ts

import { Request, Response } from 'express';
import { ApiError } from '@/core/errors/ApiError';
import { sendSuccess, sendPaginated } from '@/core/utils/sendResponse';
import { createLog } from '@/core/utils/createLog';
import { getClientIp } from '@/core/utils/getClientIp';
import * as testimonialService from './testimonial.service';
import {
  testimonialListQuerySchema,
  testimonialIdParamSchema,
  createTestimonialSchema,
  updateTestimonialSchema,
  updateTestimonialStatusSchema,
  updateTestimonialActiveSchema,
} from './testimonial.validation';

// GET /testimonials
export async function getTestimonials(req: Request, res: Response) {
  const query = testimonialListQuerySchema.parse(req.query);
  const result = await testimonialService.listTestimonials(query);
  return sendPaginated(res, result.items, result.pagination, 'Testimonials fetched successfully');
}

// GET /testimonials/:id
export async function getTestimonialById(req: Request, res: Response) {
  const { id } = testimonialIdParamSchema.parse(req.params);
  const testimonial = await testimonialService.getTestimonialById(id);

  if (req.auth) {
    await createLog({
      adminId: req.auth.id,
      description: `Viewed testimonial from "${testimonial.customerName}" (id ${id})`,
      ipAddress: getClientIp(req),
    });
  }

  return sendSuccess(res, testimonial, 'Testimonial fetched successfully');
}

// POST /testimonials
// Multipart — photo is optional and rides along with the rest of the
// form under field name "photo" when present (no file is a valid
// submission, unlike Offer's mandatory image).
export async function createTestimonial(req: Request, res: Response) {
  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const input = createTestimonialSchema.parse(req.body);
  const testimonial = await testimonialService.createTestimonial(
    input,
    req.auth.id,
    req.file?.filename,
    getClientIp(req),
  );
  return sendSuccess(res, testimonial, 'Testimonial created successfully', 201);
}

// PATCH /testimonials/:id
// Requires the full shape — the frontend always submits the complete
// form, on both Add and Edit (same convention as offer/faq). Photo,
// moderation status, and isActive are not part of this route.
export async function updateTestimonial(req: Request, res: Response) {
  const { id } = testimonialIdParamSchema.parse(req.params);
  const input = updateTestimonialSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const testimonial = await testimonialService.updateTestimonial(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, testimonial, 'Testimonial updated successfully');
}

// PATCH /testimonials/:id/status
// Moderation route — approve/reject from the review queue, same
// pattern as aiFaq's approve/reject actions.
export async function updateTestimonialStatus(req: Request, res: Response) {
  const { id } = testimonialIdParamSchema.parse(req.params);
  const input = updateTestimonialStatusSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const testimonial = await testimonialService.updateTestimonialStatus(id, input, req.auth.id, getClientIp(req));
  return sendSuccess(res, testimonial, 'Testimonial status updated successfully');
}

// PATCH /testimonials/:id/active
// Dedicated quick Active/Inactive toggle for the row-level switch —
// same pattern as offer.controller.ts's updateOfferStatus.
export async function updateTestimonialActive(req: Request, res: Response) {
  const { id } = testimonialIdParamSchema.parse(req.params);
  const { isActive } = updateTestimonialActiveSchema.parse(req.body);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const testimonial = await testimonialService.updateTestimonialActive(id, isActive, req.auth.id, getClientIp(req));
  return sendSuccess(res, testimonial, 'Testimonial visibility updated successfully');
}

// PATCH /testimonials/:id/photo
// Dedicated photo-replace route — same pattern as
// offer.controller.ts's uploadOfferImage.
export async function uploadTestimonialPhoto(req: Request, res: Response) {
  const { id } = testimonialIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }
  if (!req.file) {
    throw ApiError.badRequest('No photo file received (expected field name "photo")');
  }

  const testimonial = await testimonialService.uploadTestimonialPhoto(
    id,
    req.file.filename,
    req.auth.id,
    getClientIp(req),
  );
  return sendSuccess(res, testimonial, 'Testimonial photo updated successfully');
}

// DELETE /testimonials/:id
export async function deleteTestimonial(req: Request, res: Response) {
  const { id } = testimonialIdParamSchema.parse(req.params);

  if (!req.auth) {
    throw ApiError.unauthorized();
  }

  const result = await testimonialService.deleteTestimonial(id, req.auth.id, getClientIp(req));
  return sendSuccess(res, null, result.message);
}
