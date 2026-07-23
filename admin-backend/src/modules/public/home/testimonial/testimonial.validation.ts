// src/modules/public/home/testimonial/testimonial.validation.ts

import { z } from 'zod';

export const homeTestimonialListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(6),
});

// Public "write your own review" submission — a much smaller shape than
// the admin's createTestimonialSchema (testimonial.validation.ts under
// modules/home/testimonial): no userId (the website has no visitor login
// yet), no displayOrder/isActive (those are admin-only moderation
// controls, not something a submitter should get to set).
export const submitTestimonialSchema = z.object({
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  customerCity: z.string().trim().max(100).optional(),
  rating: z.coerce.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  quote: z.string().trim().min(5, 'Review must be at least 5 characters').max(500),
});

export type HomeTestimonialListQueryParsed = z.infer<typeof homeTestimonialListQuerySchema>;
export type SubmitTestimonialParsed = z.infer<typeof submitTestimonialSchema>;
