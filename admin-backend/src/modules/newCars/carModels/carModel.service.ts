// src/modules/newCars/carModels/carModel.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { slugify } from '@/core/utils/slugify';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  CarModelListQueryParsed,
  CreateCarModelParsed,
  UpdateCarModelParsed,
} from './carModel.validation';
import type { CarModelCoverImageResult } from './carModel.types';

const CAR_MODEL_SELECT = {
  id: true,
  brandId: true,
  name: true,
  slug: true,
  bodyType: true,
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
  const { page, limit, search, brandId, bodyType, launchStatus, sortBy, sortOrder } = query;

  const where: Prisma.CarModelWhereInput = {
    ...(brandId ? { brandId } : {}),
    ...(bodyType ? { bodyType } : {}),
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

// Auto-generates a unique slug from `name` when the caller doesn't
// supply one explicitly — e.g. "Creta" -> "creta", and if that's taken,
// "creta-2", "creta-3", etc. Same bounded-loop guard as
// brand.service.ts's generateUniqueSlug.
async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  for (let attempts = 0; attempts < 50; attempts++) {
    const existing = await prisma.carModel.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  throw ApiError.internal('Could not generate a unique slug — please provide one manually');
}

export async function createCarModel(
  input: CreateCarModelParsed,
  actorId: number,
  coverImageFilename?: string,
) {
  await assertBrandExists(input.brandId);

  const slug = input.slug ? input.slug : await generateUniqueSlug(input.name);
  if (input.slug) {
    await assertSlugAvailable(slug);
  }

  const carModel = await prisma.carModel.create({
    data: {
      brandId: input.brandId,
      name: input.name,
      slug,
      bodyType: input.bodyType,
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

  // Slug is only ever changed if the caller explicitly sends a new one —
  // renaming the model does NOT auto-regenerate the slug (same reasoning
  // as brand.service.ts: don't silently break an existing URL/bookmark).
  if (input.slug && input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  const carModel = await prisma.carModel.update({
    where: { id },
    data: {
      ...input,
      // bodyType / expectedLaunchDate / priceMin / priceMax can all be
      // explicitly nulled out — Prisma needs `null` passed through as-is
      // here, not skipped, same reasoning as Brand's countryOriginId.
      bodyType: input.bodyType,
      expectedLaunchDate: input.expectedLaunchDate,
      priceMin: input.priceMin,
      priceMax: input.priceMax,
    },
    select: CAR_MODEL_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated car model "${carModel.name}" (id ${carModel.id}) — fields: ${Object.keys(input).join(', ')}`,
  });

  return carModel;
}

// Lightweight launch-status-only update, used by the row-level quick
// select on the car model listing page — same pattern as
// brand.service.ts's updateBrandStatus.
export async function updateCarModelLaunchStatus(id: number, launchStatus: string, actorId: number) {
  await getCarModelById(id);

  const carModel = await prisma.carModel.update({
    where: { id },
    data: { launchStatus },
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

  // A car model with variants under it can't be deleted outright — same
  // "protect referenced child rows" rule as brand.service.ts's
  // deleteBrand (carModelCount check). Variants are the primary child
  // entity here; leads/reviews/images cascade from the model itself and
  // aren't a reason to block deletion.
  const variantCount = await prisma.carVariant.count({ where: { modelId: id } });
  if (variantCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this car model — ${variantCount} variant(s) are linked to it. Delete or reassign them first.`,
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