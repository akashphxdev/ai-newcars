// src/modules/public/home/testimonial/testimonial.service.ts

import { prisma } from '@/prisma/client';
import type { HomeTestimonialListQueryParsed, SubmitTestimonialParsed } from './testimonial.validation';
import type { PublicHomeTestimonialRecord, PublicTestimonialSubmitResult } from './testimonial.types';

const HOME_TESTIMONIAL_SELECT = {
  id: true,
  customerName: true,
  customerCity: true,
  photoUrl: true,
  rating: true,
  quote: true,
  createdAt: true,
} as const;

// Only approved + active testimonials are public — same moderation gate
// as the admin panel's listing, just pre-filtered here.
export async function listHomeTestimonials(
  query: HomeTestimonialListQueryParsed,
): Promise<PublicHomeTestimonialRecord[]> {
  const { limit } = query;

  const testimonials = await prisma.testimonial.findMany({
    where: { status: 'approved', isActive: true },
    select: HOME_TESTIMONIAL_SELECT,
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    take: limit,
  });

  return testimonials.map((testimonial) => ({
    ...testimonial,
    rating: testimonial.rating?.toString() ?? null,
    createdAt: testimonial.createdAt.toISOString(),
  }));
}

// Public "write your own review" submission. Status is forced to
// "pending" here (never trusted from the request) — it only becomes
// visible via listHomeTestimonials once an admin approves it through the
// existing moderation flow (testimonial.service.ts's updateTestimonialStatus).
// No userId/displayOrder — those are admin-only concerns, not something
// an anonymous website visitor supplies.
export async function submitTestimonial(input: SubmitTestimonialParsed): Promise<PublicTestimonialSubmitResult> {
  const testimonial = await prisma.testimonial.create({
    data: {
      customerName: input.customerName,
      customerCity: input.customerCity ?? null,
      rating: input.rating,
      quote: input.quote,
      status: 'pending',
      isActive: true,
      displayOrder: 0,
    },
    select: { id: true, status: true },
  });

  return testimonial;
}
