// src/modules/public/home/testimonial/testimonial.controller.ts

import { Request, Response } from 'express';
import { sendSuccess } from '@/core/utils/sendResponse';
import { homeTestimonialListQuerySchema, submitTestimonialSchema } from './testimonial.validation';
import * as testimonialService from './testimonial.service';

// GET /api/public/v1/home/testimonials
export async function getHomeTestimonials(req: Request, res: Response) {
  const query = homeTestimonialListQuerySchema.parse(req.query);
  const testimonials = await testimonialService.listHomeTestimonials(query);
  return sendSuccess(res, testimonials, 'Testimonials fetched successfully');
}

// POST /api/public/v1/home/testimonials — "write your own review"
export async function postHomeTestimonial(req: Request, res: Response) {
  const input = submitTestimonialSchema.parse(req.body);
  const result = await testimonialService.submitTestimonial(input);
  return sendSuccess(
    res,
    result,
    'Thank you! Your review has been submitted and will appear once approved.',
    201,
  );
}
