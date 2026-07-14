// src/modules/newCars/attributeOption/attributeOption.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  AttributeOptionListQueryParsed,
  CreateAttributeOptionParsed,
  UpdateAttributeOptionParsed,
} from './attributeOption.validation';
import type { AttributeOptionsGrouped } from './attributeOption.types';

const ATTRIBUTE_OPTION_SELECT = {
  id: true,
  category: true,
  name: true,
  slug: true,
} as const;

async function assertSlugAvailableInCategory(category: string, slug: string, excludeId?: number) {
  const conflict = await prisma.attributeOption.findFirst({
    where: { category, slug, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`An option with the slug "${slug}" already exists in category "${category}"`);
  }
}

export async function listAttributeOptions(query: AttributeOptionListQueryParsed) {
  const { page, limit, search, category, sortBy, sortOrder } = query;

  const where: Prisma.AttributeOptionWhereInput = {
    ...(category ? { category } : {}),
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
    prisma.attributeOption.findMany({
      where,
      select: ATTRIBUTE_OPTION_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attributeOption.count({ where }),
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

export async function listAttributeOptionsGrouped(): Promise<AttributeOptionsGrouped> {
  const items = await prisma.attributeOption.findMany({
    select: ATTRIBUTE_OPTION_SELECT,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  const grouped: AttributeOptionsGrouped = {};
  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }

  return grouped;
}

export async function getAttributeOptionById(id: number) {
  const option = await prisma.attributeOption.findUnique({
    where: { id },
    select: ATTRIBUTE_OPTION_SELECT,
  });

  if (!option) {
    throw ApiError.notFound('Attribute option not found');
  }

  return option;
}

export async function createAttributeOption(input: CreateAttributeOptionParsed, actorId: number) {
  await assertSlugAvailableInCategory(input.category, input.slug);

  const option = await prisma.attributeOption.create({
    data: {
      category: input.category,
      name: input.name,
      slug: input.slug,
    },
    select: ATTRIBUTE_OPTION_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created attribute option "${option.name}" (id ${option.id}, category "${option.category}", slug "${option.slug}")`,
  });

  return option;
}

export async function updateAttributeOption(
  id: number,
  input: UpdateAttributeOptionParsed,
  actorId: number,
) {
  const existing = await getAttributeOptionById(id);

  if (input.category !== existing.category || input.slug !== existing.slug) {
    await assertSlugAvailableInCategory(input.category, input.slug, id);
  }

  const option = await prisma.attributeOption.update({
    where: { id },
    data: input,
    select: ATTRIBUTE_OPTION_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated attribute option "${option.name}" (id ${option.id})`,
  });

  return option;
}

export async function deleteAttributeOption(id: number, actorId: number) {
  const option = await getAttributeOptionById(id);

  const [variantCount, icePowertrainAsTransmission, icePowertrainAsDrivetrain, electricPowertrainCount] =
    await Promise.all([
      prisma.carVariant.count({ where: { transmissionId: id } }),
      prisma.carPowertrainIce.count({ where: { transmissionTypeId: id } }),
      prisma.carPowertrainIce.count({ where: { drivetrainId: id } }),
      prisma.carPowertrainElectric.count({ where: { drivetrainId: id } }),
    ]);

  const usageCount =
    variantCount + icePowertrainAsTransmission + icePowertrainAsDrivetrain + electricPowertrainCount;

  if (usageCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this option — it is linked to ${usageCount} record(s). Reassign or delete them first.`,
    );
  }

  await prisma.attributeOption.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted attribute option "${option.name}" (id ${id}, category "${option.category}")`,
  });

  return { message: 'Attribute option deleted successfully' };
}