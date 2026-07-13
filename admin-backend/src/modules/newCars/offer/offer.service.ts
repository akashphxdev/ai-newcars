// src/modules/newCars/offer/offer.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type { OfferListQueryParsed, CreateOfferParsed, UpdateOfferParsed } from './offer.validation';
import type { OfferRecord, OfferUploadImageResult } from './offer.types';

const OFFER_SELECT = {
  id: true,
  modelId: true,
  variantId: true,
  cityId: true,
  offerType: true,
  offerAmount: true,
  description: true,
  validFrom: true,
  validUntil: true,
  isActive: true,
  imageUrl: true,
  model: {
    select: {
      id: true,
      name: true,
      brand: { select: { id: true, name: true } },
    },
  },
  variant: { select: { id: true, variantName: true } },
  city: { select: { id: true, name: true } },
} as const;

export async function listOffers(query: OfferListQueryParsed) {
  const { page, limit, search, modelId, variantId, cityId, isActive, sortBy, sortOrder } = query;

  const where: Prisma.NewCarOfferWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(variantId ? { variantId } : {}),
    ...(cityId ? { cityId } : {}),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(search ? { description: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.newCarOffer.findMany({
      where,
      select: OFFER_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.newCarOffer.count({ where }),
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

export async function getOfferById(id: number): Promise<OfferRecord> {
  const offer = await prisma.newCarOffer.findUnique({
    where: { id },
    select: OFFER_SELECT,
  });

  if (!offer) {
    throw ApiError.notFound('Offer not found');
  }

  return offer as unknown as OfferRecord;
}

// Every offer must belong to a real, existing car model — same
// "validate the parent foreign key" rule as variant.service.ts's /
// faq.service.ts's assertModelExists.
async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

// variantId/cityId are optional, but if provided they must be real rows,
// and the variant (when given) must actually belong to the chosen model.
async function assertVariantExists(variantId: number, modelId: number) {
  const variant = await prisma.carVariant.findUnique({
    where: { id: variantId },
    select: { id: true, modelId: true },
  });
  if (!variant) {
    throw ApiError.badRequest('Invalid variantId — variant does not exist');
  }
  if (variant.modelId !== modelId) {
    throw ApiError.badRequest('Selected variant does not belong to the selected car model');
  }
}

async function assertCityExists(cityId: number) {
  const city = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
  if (!city) {
    throw ApiError.badRequest('Invalid cityId — city does not exist');
  }
}

export async function createOffer(input: CreateOfferParsed, actorId: number, imageFilename: string) {
  await assertModelExists(input.modelId);
  if (input.variantId) await assertVariantExists(input.variantId, input.modelId);
  if (input.cityId) await assertCityExists(input.cityId);

  const offer = await prisma.newCarOffer.create({
    data: {
      modelId: input.modelId,
      variantId: input.variantId ?? null,
      cityId: input.cityId ?? null,
      offerType: input.offerType ?? null,
      offerAmount: input.offerAmount ?? null,
      description: input.description ?? null,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
      isActive: input.isActive,
      // Image is required on create — controller already rejects the
      // request before this point if no file was uploaded.
      imageUrl: buildPublicPath('offers', imageFilename),
    },
    select: OFFER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created offer (id ${offer.id}) under model id ${offer.modelId}`,
  });

  return offer;
}

// Full replace on every edit — same convention as faq.service.ts /
// variant.service.ts, not a partial PATCH like Brand/CarModel. Image is
// NOT touched here — it has its own dedicated route/mutation
// (uploadOfferImage), same split as Brand's logo.
export async function updateOffer(id: number, input: UpdateOfferParsed, actorId: number) {
  await getOfferById(id);
  await assertModelExists(input.modelId);
  if (input.variantId) await assertVariantExists(input.variantId, input.modelId);
  if (input.cityId) await assertCityExists(input.cityId);

  const offer = await prisma.newCarOffer.update({
    where: { id },
    data: {
      modelId: input.modelId,
      variantId: input.variantId ?? null,
      cityId: input.cityId ?? null,
      offerType: input.offerType ?? null,
      offerAmount: input.offerAmount ?? null,
      description: input.description ?? null,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
      isActive: input.isActive,
    },
    select: OFFER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated offer (id ${id})`,
  });

  return offer;
}

// Lightweight row-level Active/Inactive toggle — separate from the full
// edit mutation so flipping the switch doesn't need the whole edit
// form's payload. Same pattern as brand.service.ts's updateBrandStatus.
export async function updateOfferStatus(id: number, isActive: boolean, actorId: number) {
  await getOfferById(id);

  const offer = await prisma.newCarOffer.update({
    where: { id },
    data: { isActive },
    select: OFFER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} offer (id ${id})`,
  });

  return offer;
}

// Dedicated image-replace route — same split as brand.service.ts's
// uploadBrandLogo (main PATCH /:id is JSON-only; swapping the image
// needs multipart, so it gets its own endpoint).
export async function uploadOfferImage(
  id: number,
  savedFilename: string,
  actorId: number,
): Promise<OfferUploadImageResult> {
  const existing = await getOfferById(id);

  const newImageUrl = buildPublicPath('offers', savedFilename);

  const offer = await prisma.newCarOffer.update({
    where: { id },
    data: { imageUrl: newImageUrl },
    select: { id: true, imageUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds — if the
  // update had failed we'd want the old image to remain intact.
  await deleteUploadedFile(existing.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Updated image for offer (id ${id})`,
  });

  return offer;
}

export async function deleteOffer(id: number, actorId: number) {
  const offer = await getOfferById(id);

  await prisma.newCarOffer.delete({ where: { id } });

  // Offer row is gone — its image file on disk is now orphaned, clean
  // it up. Same order-of-operations as brand.service.ts's deleteBrand.
  await deleteUploadedFile(offer.imageUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted offer (id ${id})`,
  });

  return { message: 'Offer deleted successfully' };
}