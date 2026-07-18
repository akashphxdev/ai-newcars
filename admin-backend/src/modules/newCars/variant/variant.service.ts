// src/modules/newCars/variant/variant.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  VariantListQueryParsed,
  VariantOptionsQueryParsed,
  CreateVariantParsed,
  UpdateVariantParsed,
} from './variant.validation';
import type { VariantRecord } from './variant.types';

const VARIANT_SELECT = {
  id: true,
  modelId: true,
  variantName: true,
  price: true,
  seatingCapacity: true,
  transmissionId: true,
  transmission: {
    select: { id: true, name: true, slug: true },
  },
  isTopSeller: true,
  createdAt: true,
  model: {
    select: {
      id: true,
      name: true,
      brand: { select: { id: true, name: true } },
    },
  },
} as const;

export async function listVariants(query: VariantListQueryParsed) {
  const { page, limit, search, modelId, transmissionId, isTopSeller, sortBy, sortOrder } = query;

  const where: Prisma.CarVariantWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(transmissionId ? { transmissionId } : {}),
    ...(typeof isTopSeller === 'boolean' ? { isTopSeller } : {}),
    ...(search ? { variantName: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carVariant.findMany({
      where,
      select: VARIANT_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carVariant.count({ where }),
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

// Dropdown-only source — every matching variant in one shot, no
// pagination, optionally scoped to a model. Same "why" as
// carModel.service.ts's listCarModelOptions — the regular listVariants()
// stays paginated for the Variants list page.
export async function listVariantOptions(query: VariantOptionsQueryParsed) {
  const { modelId } = query;

  const where: Prisma.CarVariantWhereInput = {
    ...(modelId ? { modelId } : {}),
  };

  return prisma.carVariant.findMany({
    where,
    select: { id: true, variantName: true, modelId: true },
    orderBy: { variantName: 'asc' },
  });
}

export async function getVariantById(id: number): Promise<VariantRecord> {
  const variant = await prisma.carVariant.findUnique({
    where: { id },
    select: VARIANT_SELECT,
  });

  if (!variant) {
    throw ApiError.notFound('Variant not found');
  }

  return variant as unknown as VariantRecord;
}

// Every variant must belong to a real, existing car model — same
// "validate the parent foreign key" rule as brand.service.ts's
// assertCountryExists and carModel.service.ts's assertBrandExists.
async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

// transmissionId must point at a real attribute_options row that actually
// belongs to the "transmission" category (not, say, a "drivetrain" option
// that happens to share an id range) — same shape check as
// attributeOption.service.ts's own category-scoped lookups.
async function assertTransmissionOptionExists(transmissionId: number) {
  const option = await prisma.attributeOption.findFirst({
    where: { id: transmissionId, category: 'transmission' },
    select: { id: true },
  });
  if (!option) {
    throw ApiError.badRequest('Invalid transmissionId — transmission option does not exist');
  }
}

// No two variants under the same car model may share a name (e.g. two
// "SX(O) Turbo DCT" under the same model). Backed by a DB-level unique
// index too — this check just turns that into a friendly error instead
// of a raw constraint failure, same pattern as Brand/CarModel's
// assertSlugAvailable checks.
async function assertVariantNameUnique(modelId: number, variantName: string, excludeId?: number) {
  const conflict = await prisma.carVariant.findFirst({
    where: {
      modelId,
      variantName,
      id: excludeId ? { not: excludeId } : undefined,
    },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`A variant named "${variantName}" already exists for this car model`);
  }
}

export async function createVariant(
  input: CreateVariantParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await assertModelExists(input.modelId);
  await assertTransmissionOptionExists(input.transmissionId);
  await assertVariantNameUnique(input.modelId, input.variantName);

  const variant = await prisma.carVariant.create({
    data: {
      modelId: input.modelId,
      variantName: input.variantName,
      price: input.price,
      seatingCapacity: input.seatingCapacity,
      transmissionId: input.transmissionId,
      isTopSeller: input.isTopSeller,
    },
    select: VARIANT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created variant "${variant.variantName}" (id ${variant.id}) under model id ${variant.modelId}`,
    ipAddress,
  });

  return variant;
}

// Every field is required here too (per product requirement) — this is a
// full replace on every edit, not a partial PATCH like Brand/CarModel.
export async function updateVariant(
  id: number,
  input: UpdateVariantParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await getVariantById(id);
  await assertModelExists(input.modelId);
  await assertTransmissionOptionExists(input.transmissionId);
  await assertVariantNameUnique(input.modelId, input.variantName, id);

  const variant = await prisma.carVariant.update({
    where: { id },
    data: {
      modelId: input.modelId,
      variantName: input.variantName,
      price: input.price,
      seatingCapacity: input.seatingCapacity,
      transmissionId: input.transmissionId,
      isTopSeller: input.isTopSeller,
    },
    select: VARIANT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated variant "${variant.variantName}" (id ${id})`,
    ipAddress,
  });

  return variant;
}

export async function deleteVariant(id: number, actorId: number, ipAddress?: string | null) {
  const variant = await getVariantById(id);

  // A variant can't be deleted while ICE/electric powertrains (or other
  // dependent records) still reference it — the DB would reject this with
  // a raw foreign-key error, so check up front and tell the user exactly
  // what's still attached, same pattern as attributeOption.service.ts's
  // deleteAttributeOption usage check.
  // CarFeature is also a RESTRICT FK on variantId (car_images, new_car_offers,
  // used_car_listings, and reviews are SET NULL there and so don't block
  // deletion — only the powertrains and features do).
  const [icePowertrainCount, electricPowertrainCount, featureCount] = await Promise.all([
    prisma.carPowertrainIce.count({ where: { variantId: id } }),
    prisma.carPowertrainElectric.count({ where: { variantId: id } }),
    prisma.carFeature.count({ where: { variantId: id } }),
  ]);

  const linkedParts: string[] = [];
  if (icePowertrainCount > 0) {
    linkedParts.push(`${icePowertrainCount} ICE powertrain${icePowertrainCount > 1 ? 's' : ''}`);
  }
  if (electricPowertrainCount > 0) {
    linkedParts.push(`${electricPowertrainCount} electric powertrain${electricPowertrainCount > 1 ? 's' : ''}`);
  }
  if (featureCount > 0) {
    linkedParts.push(`${featureCount} feature record${featureCount > 1 ? 's' : ''}`);
  }

  if (linkedParts.length > 0) {
    throw ApiError.badRequest(
      `Cannot delete this variant — it still has ${linkedParts.join(' and ')} linked to it. Delete those first, then try again.`,
    );
  }

  await prisma.carVariant.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted variant "${variant.variantName}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Variant deleted successfully' };
}