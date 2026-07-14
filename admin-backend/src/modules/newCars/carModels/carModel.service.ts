// src/modules/newCars/carModels/carModel.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  CarModelListQueryParsed,
  CarModelOptionsQueryParsed,
  CreateCarModelParsed,
  UpdateCarModelParsed,
} from './carModel.validation';
import type { CarModelCoverImageResult } from './carModel.types';

const CAR_MODEL_SELECT = {
  id: true,
  brandId: true,
  name: true,
  slug: true,
  bodyTypeId: true,
  bodyType: {
    select: { id: true, name: true, slug: true },
  },
  launchStatus: true,
  expectedLaunchDate: true,
  priceMin: true,
  priceMax: true,
  ratingAvg: true,
  coverImageUrl: true,
  createdAt: true,
  brand: {
    select: { id: true, name: true },
  },
} as const;

export async function listCarModels(query: CarModelListQueryParsed) {
  const { page, limit, search, brandId, bodyTypeId, launchStatus, sortBy, sortOrder } = query;

  const where: Prisma.CarModelWhereInput = {
    ...(brandId ? { brandId } : {}),
    ...(bodyTypeId ? { bodyTypeId } : {}),
    ...(launchStatus ? { launchStatus } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carModel.findMany({
      where,
      select: CAR_MODEL_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carModel.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

// Dropdown-only source — every matching car model in one shot, no
// pagination, optionally scoped to a brand. Same "why" as
// brand.service.ts's listBrandOptions — the regular listCarModels()
// stays paginated for the Car Models list page. `brandId` is included
// in the response so cascading Brand → Model pickers can also filter
// client-side if a consumer already fetched the unscoped set.
export async function listCarModelOptions(query: CarModelOptionsQueryParsed) {
  const { brandId } = query;

  const where: Prisma.CarModelWhereInput = {
    ...(brandId ? { brandId } : {}),
  };

  return prisma.carModel.findMany({
    where,
    // brand.name is included because nearly every consumer renders this
    // dropdown as "Brand — Model" (Variant/Powertrain/Offer/Faq/Video
    // forms & filters) — without it those labels can't be built.
    select: { id: true, name: true, brandId: true, brand: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getCarModelById(id: number) {
  const carModel = await prisma.carModel.findUnique({
    where: { id },
    select: CAR_MODEL_SELECT,
  });

  if (!carModel) {
    throw ApiError.notFound('Car model not found');
  }

  return carModel;
}

async function assertBrandExists(brandId: number) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } });
  if (!brand) {
    throw ApiError.badRequest('Invalid brandId — brand does not exist');
  }
}

// Same "validate the parent foreign key" rule as assertBrandExists above —
// bodyTypeId now points at the body_types table instead of being a
// hardcoded enum, so it needs the same existence check.
async function assertBodyTypeExists(bodyTypeId: number) {
  const bodyType = await prisma.bodyType.findUnique({ where: { id: bodyTypeId }, select: { id: true } });
  if (!bodyType) {
    throw ApiError.badRequest('Invalid bodyTypeId — body type does not exist');
  }
}

// `slug` IS @unique in schema.prisma (DB-level) — same pattern as
// brand.service.ts's assertSlugAvailable.
async function assertSlugAvailable(slug: string, excludeId?: number) {
  const conflict = await prisma.carModel.findFirst({
    where: { slug, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`A car model with the slug "${slug}" already exists`);
  }
}

export async function createCarModel(
  input: CreateCarModelParsed,
  actorId: number,
  coverImageFilename?: string,
) {
  await assertBrandExists(input.brandId);
  await assertBodyTypeExists(input.bodyTypeId);

  await assertSlugAvailable(input.slug);

  const carModel = await prisma.carModel.create({
    data: {
      brandId: input.brandId,
      name: input.name,
      slug: input.slug,
      bodyTypeId: input.bodyTypeId,
      launchStatus: input.launchStatus,
      expectedLaunchDate: input.expectedLaunchDate,
      priceMin: input.priceMin,
      priceMax: input.priceMax,
      coverImageUrl: coverImageFilename ? buildPublicPath('car-model-covers', coverImageFilename) : null,
    },
    select: CAR_MODEL_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created car model "${carModel.name}" (id ${carModel.id}, slug "${carModel.slug}")`,
  });

  return carModel;
}

export async function updateCarModel(id: number, input: UpdateCarModelParsed, actorId: number) {
  const existing = await getCarModelById(id);

  if (typeof input.brandId === 'number') {
    await assertBrandExists(input.brandId);
  }

  if (typeof input.bodyTypeId === 'number') {
    await assertBodyTypeExists(input.bodyTypeId);
  }

  if (input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  // Figure out the *effective* launch status/date this update would result
  // in (payload value if given, else whatever's already on the record) —
  // needed because the schema-level refine only catches the case where
  // launchStatus is explicitly set to "upcoming" in this request; it can't
  // see that a record already sitting at "upcoming" mustn't lose its date.
  const effectiveLaunchStatus = input.launchStatus ?? existing.launchStatus;
  let effectiveExpectedLaunchDate: Date | null;
  if (effectiveLaunchStatus === 'upcoming') {
    effectiveExpectedLaunchDate =
      input.expectedLaunchDate !== undefined ? input.expectedLaunchDate : existing.expectedLaunchDate;
    if (!effectiveExpectedLaunchDate) {
      throw ApiError.badRequest('Expected launch date is required when launch status is "upcoming"');
    }
  } else {
    // Not upcoming (anymore) — a stale expected-launch-date has no
    // business meaning once a model is available/discontinued, so clear it
    // rather than leaving old data sitting around silently.
    effectiveExpectedLaunchDate = null;
  }

  const carModel = await prisma.carModel.update({
    where: { id },
    data: {
      ...input,
      // bodyTypeId / priceMin / priceMax are required fields now (schema
      // no longer allows null) — passing them through as-is is fine and
      // matches Prisma's "omit the key to leave unchanged" semantics.
      bodyTypeId: input.bodyTypeId,
      priceMin: input.priceMin,
      priceMax: input.priceMax,
      expectedLaunchDate: effectiveExpectedLaunchDate,
    },
    select: CAR_MODEL_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated car model "${carModel.name}" (id ${carModel.id})`,
  });

  return carModel;
}

// Lightweight launch-status-only update, used by the row-level quick
// select on the car model listing page — same pattern as
// brand.service.ts's updateBrandStatus.
export async function updateCarModelLaunchStatus(
  id: number,
  launchStatus: string,
  expectedLaunchDate: Date | undefined,
  actorId: number,
) {
  const existing = await getCarModelById(id);

  let effectiveExpectedLaunchDate: Date | null;
  if (launchStatus === 'upcoming') {
    // Use the date that came with this request if given, otherwise fall
    // back to whatever the record already had (covers re-saving the same
    // status). The validation schema already requires the caller to send
    // one when the record isn't already "upcoming".
    effectiveExpectedLaunchDate = expectedLaunchDate ?? existing.expectedLaunchDate;
    if (!effectiveExpectedLaunchDate) {
      throw ApiError.badRequest('Expected launch date is required when launch status is "upcoming"');
    }
  } else {
    // Moving away from "upcoming" — clear the now-meaningless date rather
    // than leaving stale data behind.
    effectiveExpectedLaunchDate = null;
  }

  const carModel = await prisma.carModel.update({
    where: { id },
    data: { launchStatus, expectedLaunchDate: effectiveExpectedLaunchDate },
    select: CAR_MODEL_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Changed launch status of car model "${carModel.name}" (id ${id}) to "${launchStatus}"`,
  });

  return carModel;
}

// PATCH /car-models/:id/cover-image — dedicated endpoint for replacing just
// the cover thumbnail without resending the whole edit form. Mirrors
// image.service.ts's replaceImageFile: write the new file, update the DB,
// and only delete the old file AFTER the DB write succeeds.
export async function uploadCarModelCoverImage(
  id: number,
  savedFilename: string,
  actorId: number,
): Promise<CarModelCoverImageResult> {
  const existing = await getCarModelById(id);

  const newCoverImageUrl = buildPublicPath('car-model-covers', savedFilename);

  const carModel = await prisma.carModel.update({
    where: { id },
    data: { coverImageUrl: newCoverImageUrl },
    select: { id: true, coverImageUrl: true },
  });

  if (existing.coverImageUrl) {
    await deleteUploadedFile(existing.coverImageUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Replaced cover image for car model "${existing.name}" (id ${id})`,
  });

  return carModel as CarModelCoverImageResult;
}

export async function deleteCarModel(id: number, actorId: number) {
  const carModel = await getCarModelById(id);

  // A car model with any of these still pointing at it can't be deleted
  // outright — same "protect referenced child rows" rule as
  // brand.service.ts's deleteBrand (carModelCount check). All of these
  // are RESTRICT foreign keys at the DB level (unlike the various lead
  // tables and MediaStory, which are SET NULL on modelId and so don't
  // block deletion) — without checking each one up front, deleting a
  // model that still has e.g. images or reviews on it would fail with a
  // raw DB foreign-key error instead of this friendly message.
  const [
    variantCount,
    imageCount,
    faqCount,
    videoCount,
    colorCount,
    offerCount,
    usedListingCount,
    reviewCount,
    storyModelCount,
  ] = await Promise.all([
    prisma.carVariant.count({ where: { modelId: id } }),
    prisma.carImage.count({ where: { modelId: id } }),
    prisma.carFaq.count({ where: { modelId: id } }),
    prisma.carVideo.count({ where: { modelId: id } }),
    prisma.carColor.count({ where: { modelId: id } }),
    prisma.newCarOffer.count({ where: { modelId: id } }),
    prisma.usedCarListing.count({ where: { modelId: id } }),
    prisma.review.count({ where: { modelId: id } }),
    prisma.storyModel.count({ where: { modelId: id } }),
  ]);

  const linkedParts: string[] = [];
  if (variantCount > 0) linkedParts.push(`${variantCount} variant(s)`);
  if (imageCount > 0) linkedParts.push(`${imageCount} image(s)`);
  if (faqCount > 0) linkedParts.push(`${faqCount} FAQ(s)`);
  if (videoCount > 0) linkedParts.push(`${videoCount} video(s)`);
  if (colorCount > 0) linkedParts.push(`${colorCount} color(s)`);
  if (offerCount > 0) linkedParts.push(`${offerCount} offer(s)`);
  if (usedListingCount > 0) linkedParts.push(`${usedListingCount} used-car listing(s)`);
  if (reviewCount > 0) linkedParts.push(`${reviewCount} review(s)`);
  if (storyModelCount > 0) linkedParts.push(`${storyModelCount} story link(s)`);

  if (linkedParts.length > 0) {
    throw ApiError.badRequest(
      `Cannot delete this car model — ${linkedParts.join(', ')} are linked to it. Delete or reassign them first.`,
    );
  }

  await prisma.carModel.delete({ where: { id } });

  // Row is gone — its cover image file on disk (if any) is now orphaned.
  if (carModel.coverImageUrl) {
    await deleteUploadedFile(carModel.coverImageUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Deleted car model "${carModel.name}" (id ${id})`,
  });

  return { message: 'Car model deleted successfully' };
}