// src/modules/home/testimonial/testimonial.validation.ts

import { z } from 'zod';

export const TESTIMONIAL_STATUSES = ['pending', 'approved', 'rejected'] as const;

// FormData (multipart, used on create/update since a photo file rides
// along) serializes booleans as the strings "true"/"false" — plain
// z.boolean() rejects those outright. Same fix as brand.validation.ts's
// `booleanish`.
const booleanish = z.preprocess((val) => {
  if (typeof val === 'string') return val === 'true';
  return val;
}, z.boolean());

export const testimonialListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: z.enum(TESTIMONIAL_STATUSES).optional(),
  isActive: booleanish.optional(),
  sortBy: z.enum(['id', 'displayOrder', 'rating', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const testimonialIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// photoUrl is never client-supplied — it always rides along as an
// uploaded file (create's `photo` field / the dedicated photo-upload
// route), same convention as brand's logo. userId links this
// testimonial to a real site user when the admin is attaching one to
// an existing account — optional, since most testimonials are entered
// by an admin on a customer's behalf with no linked account.
const testimonialShape = {
  userId: z.coerce.number().int().positive().nullable().optional(),
  customerName: z.string().trim().min(2, 'Customer name must be at least 2 characters').max(100),
  customerCity: z.string().trim().max(100).nullable().optional(),
  rating: z.coerce.number().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5').nullable().optional(),
  quote: z.string().trim().min(5, 'Quote must be at least 5 characters').max(500),
  displayOrder: z.coerce.number().int().min(0, 'displayOrder must be 0 or greater').default(0),
  isActive: booleanish,
};

export const createTestimonialSchema = z.object(testimonialShape);

// Full replace on every edit — same convention as offer.validation.ts /
// faq.validation.ts, not a partial PATCH. Photo is NOT part of this
// shape — it has its own dedicated route (uploadTestimonialPhoto), same
// split as brand's logo. Moderation status/isActive are NOT part of
// this shape either — see updateTestimonialStatusSchema below.
export const updateTestimonialSchema = z.object(testimonialShape);

// Moderation workflow — pending -> approved/rejected, same reviewedBy/
// reviewedAt pattern as aiFaq.service.ts's approve/reject. rejectedReason
// is required when rejecting, same "conditionally required" convention
// as article.validation.ts's withScheduleRule.
export const updateTestimonialStatusSchema = z
  .object({
    status: z.enum(TESTIMONIAL_STATUSES),
    rejectedReason: z.string().trim().max(255).nullable().optional(),
  })
  .refine((data) => data.status !== 'rejected' || !!data.rejectedReason, {
    message: 'rejectedReason is required when status is "rejected"',
    path: ['rejectedReason'],
  });

// Lightweight row-level Active/Inactive toggle (shows/hides an already
// approved testimonial on the site) — separate from the moderation
// status above, same pattern as offer.validation.ts's updateOfferStatusSchema.
export const updateTestimonialActiveSchema = z.object({
  isActive: booleanish,
});

export type TestimonialListQueryParsed = z.infer<typeof testimonialListQuerySchema>;
export type CreateTestimonialParsed = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialParsed = z.infer<typeof updateTestimonialSchema>;
export type UpdateTestimonialStatusParsed = z.infer<typeof updateTestimonialStatusSchema>;
export type UpdateTestimonialActiveParsed = z.infer<typeof updateTestimonialActiveSchema>;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];
