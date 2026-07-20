// src/modules/home/testimonial/testimonial.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  TestimonialListQueryParsed,
  CreateTestimonialParsed,
  UpdateTestimonialParsed,
  UpdateTestimonialStatusParsed,
} from './testimonial.validation';
import type { TestimonialRecord, TestimonialUploadPhotoResult } from './testimonial.types';

const TESTIMONIAL_SELECT = {
  id: true,
  userId: true,
  user: { select: { id: true, name: true } },
  customerName: true,
  customerCity: true,
  photoUrl: true,
  rating: true,
  quote: true,
  status: true,
  rejectedReason: true,
  reviewedBy: true,
  reviewedByAdmin: { select: { id: true, name: true } },
  reviewedAt: true,
  displayOrder: true,
  isActive: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
} as const;

export async function listTestimonials(query: TestimonialListQueryParsed) {
  const { page, limit, search, status, isActive, sortBy, sortOrder } = query;

  const where: Prisma.TestimonialWhereInput = {
    ...(status ? { status } : {}),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { customerName: { contains: search, mode: 'insensitive' } },
            { quote: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      select: TESTIMONIAL_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return {
    items: items as unknown as TestimonialRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getTestimonialById(id: number): Promise<TestimonialRecord> {
  const testimonial = await prisma.testimonial.findUnique({
    where: { id },
    select: TESTIMONIAL_SELECT,
  });

  if (!testimonial) {
    throw ApiError.notFound('Testimonial not found');
  }

  return testimonial as unknown as TestimonialRecord;
}

async function assertUserExists(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw ApiError.badRequest('Invalid userId — user does not exist');
  }
}

// Testimonial has no DB-level unique constraint on displayOrder (unlike
// StoryGroup's `@@unique([displayOrder])`) — this is an app-level-only
// check, same shape as banner.service.ts's assertDisplayOrderAvailable /
// faq.service.ts's, but without a DB constraint backing it there's a
// small race-condition window under concurrent saves.
async function assertDisplayOrderAvailable(displayOrder: number, excludeId?: number) {
  const conflict = await prisma.testimonial.findFirst({
    where: { displayOrder, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`Display order ${displayOrder} is already used by another testimonial`);
  }
}

// Photo is optional (schema's photoUrl is nullable) — unlike Offer's
// image, a testimonial can be created with no photo at all.
//
// Auto-approved on creation: every testimonial.routes.ts route
// (including this one) requires an authenticated admin — there is no
// public/user submission path yet — so an admin creating one here IS
// the approval. Forcing it through the pending -> approve queue would
// just mean the same admin approving their own entry a second time.
// If a public "submit a testimonial" endpoint is ever added, that path
// should leave status at the schema's "pending" default instead.
export async function createTestimonial(
  input: CreateTestimonialParsed,
  actorId: number,
  photoFilename?: string,
  ipAddress?: string | null,
) {
  if (input.userId) {
    await assertUserExists(input.userId);
  }
  await assertDisplayOrderAvailable(input.displayOrder);

  const testimonial = await prisma.testimonial.create({
    data: {
      userId: input.userId ?? null,
      customerName: input.customerName,
      customerCity: input.customerCity ?? null,
      rating: input.rating ?? null,
      quote: input.quote,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
      photoUrl: photoFilename ? buildPublicPath('testimonials', photoFilename) : null,
      createdBy: actorId,
      status: 'approved',
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
    select: TESTIMONIAL_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created testimonial from "${testimonial.customerName}" (id ${testimonial.id})`,
    ipAddress,
  });

  return testimonial as unknown as TestimonialRecord;
}

// Full replace on every edit — same convention as offer.service.ts.
// Photo, moderation status, and isActive are NOT touched here — each
// has its own dedicated route/mutation.
export async function updateTestimonial(
  id: number,
  input: UpdateTestimonialParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await getTestimonialById(id);

  if (input.userId) {
    await assertUserExists(input.userId);
  }
  await assertDisplayOrderAvailable(input.displayOrder, id);

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: {
      userId: input.userId ?? null,
      customerName: input.customerName,
      customerCity: input.customerCity ?? null,
      rating: input.rating ?? null,
      quote: input.quote,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
    },
    select: TESTIMONIAL_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated testimonial from "${existing.customerName}" (id ${id})`,
    ipAddress,
  });

  return testimonial as unknown as TestimonialRecord;
}

// Moderation workflow — pending -> approved/rejected. Sets
// reviewedBy/reviewedAt server-side, same pattern as aiFaq.service.ts's
// approveAiFaq/rejectAiFaq.
export async function updateTestimonialStatus(
  id: number,
  input: UpdateTestimonialStatusParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await getTestimonialById(id);

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: {
      status: input.status,
      rejectedReason: input.status === 'rejected' ? input.rejectedReason ?? null : null,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
    select: TESTIMONIAL_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${
      input.status === 'approved' ? 'Approved' : input.status === 'rejected' ? 'Rejected' : 'Reset'
    } testimonial from "${existing.customerName}" (id ${id})`,
    ipAddress,
  });

  return testimonial as unknown as TestimonialRecord;
}

// Lightweight row-level Active/Inactive toggle (shows/hides an already
// approved testimonial on the site) — separate from the moderation
// status above, same pattern as offer.service.ts's updateOfferStatus.
export async function updateTestimonialActive(
  id: number,
  isActive: boolean,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await getTestimonialById(id);

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { isActive },
    select: TESTIMONIAL_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} testimonial from "${existing.customerName}" (id ${id})`,
    ipAddress,
  });

  return testimonial as unknown as TestimonialRecord;
}

// Dedicated photo-replace route — main PATCH /:id above stays
// JSON-only, same split as offer.service.ts's uploadOfferImage.
export async function uploadTestimonialPhoto(
  id: number,
  savedFilename: string,
  actorId: number,
  ipAddress?: string | null,
): Promise<TestimonialUploadPhotoResult> {
  const existing = await getTestimonialById(id);

  const newPhotoUrl = buildPublicPath('testimonials', savedFilename);

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { photoUrl: newPhotoUrl },
    select: { id: true, photoUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds — if the
  // update had failed we'd want the old photo to remain intact.
  if (existing.photoUrl) {
    await deleteUploadedFile(existing.photoUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Updated photo for testimonial from "${existing.customerName}" (id ${id})`,
    ipAddress,
  });

  return testimonial as TestimonialUploadPhotoResult;
}

export async function deleteTestimonial(id: number, actorId: number, ipAddress?: string | null) {
  const testimonial = await getTestimonialById(id);

  await prisma.testimonial.delete({ where: { id } });

  // Testimonial row is gone — its photo file on disk (if any) is now
  // orphaned, clean it up. Same order-of-operations as offer.service.ts's
  // deleteOffer.
  if (testimonial.photoUrl) {
    await deleteUploadedFile(testimonial.photoUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Deleted testimonial from "${testimonial.customerName}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Testimonial deleted successfully' };
}
