// src/modules/newCars/variant/variant.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  VariantListQueryParsed,
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
  transmission: true,
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
  const { page, limit, search, modelId, transmission, isTopSeller, sortBy, sortOrder } = query;

  const where: Prisma.CarVariantWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(transmission ? { transmission } : {}),
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

export async function createVariant(input: CreateVariantParsed, actorId: number) {
  await assertModelExists(input.modelId);

  const variant = await prisma.carVariant.create({
    data: {
      modelId: input.modelId,
      variantName: input.variantName,
      price: input.price,
      seatingCapacity: input.seatingCapacity,
      transmission: input.transmission,
      isTopSeller: input.isTopSeller,
    },
    select: VARIANT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created variant "${variant.variantName}" (id ${variant.id}) under model id ${variant.modelId}`,
  });

  return variant;
}

// Every field is required here too (per product requirement) — this is a
// full replace on every edit, not a partial PATCH like Brand/CarModel.
export async function updateVariant(id: number, input: UpdateVariantParsed, actorId: number) {
  await getVariantById(id);
  await assertModelExists(input.modelId);

  const variant = await prisma.carVariant.update({
    where: { id },
    data: {
      modelId: input.modelId,
      variantName: input.variantName,
      price: input.price,
      seatingCapacity: input.seatingCapacity,
      transmission: input.transmission,
      isTopSeller: input.isTopSeller,
    },
    select: VARIANT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated variant "${variant.variantName}" (id ${id})`,
  });

  return variant;
}

export async function deleteVariant(id: number, actorId: number) {
  const variant = await getVariantById(id);

  await prisma.carVariant.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted variant "${variant.variantName}" (id ${id})`,
  });

  return { message: 'Variant deleted successfully' };
}