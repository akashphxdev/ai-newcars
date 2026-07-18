// src/modules/locations/country/country.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  CountryListQueryParsed,
  CountryOptionsQueryParsed,
  CreateCountryParsed,
  UpdateCountryParsed,
} from './country.validation';

export async function listCountries(query: CountryListQueryParsed) {
  const { page, limit, search, isActive, sortBy, sortOrder } = query;

  const where: Prisma.CountryWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.country.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.country.count({ where }),
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

// Dropdown-only source — returns every matching country in one shot
// (no pagination) with just the fields a <select> needs. The regular
// listCountries() above stays paginated for the Countries list page;
// this is for every other screen that just needs "all countries" to
// populate a dropdown (State/District/City/Brand forms & filters).
export async function listCountryOptions(query: CountryOptionsQueryParsed) {
  const { isActive } = query;

  const where: Prisma.CountryWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
  };

  return prisma.country.findMany({
    where,
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });
}

export async function getCountryById(id: number) {
  const country = await prisma.country.findUnique({ where: { id } });

  if (!country) {
    throw ApiError.notFound('Country not found');
  }

  return country;
}


async function assertNameAndCodeAvailable(name: string, code: string, excludeId?: number) {
  const conflict = await prisma.country.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { code: { equals: code, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, code: true },
  });

  if (conflict) {
    const field = conflict.name.toLowerCase() === name.toLowerCase() ? 'name' : 'code';
    throw ApiError.conflict(`A country with this ${field} already exists`);
  }
}

export async function createCountry(
  input: CreateCountryParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await assertNameAndCodeAvailable(input.name, input.code);

  const country = await prisma.country.create({
    data: {
      name: input.name,
      code: input.code,
      currency: input.currency,
      currencySymbol: input.currencySymbol,
      currencyCode: input.currencyCode,
      exchangeRate: input.exchangeRate,
      distanceUnit: input.distanceUnit,
      fuelUnit: input.fuelUnit,
      isActive: input.isActive ?? true,
    },
  });

  await createLog({
    adminId: actorId,
    description: `Created country "${country.name}" (id ${country.id})`,
    ipAddress,
  });

  return country;
}

export async function updateCountry(
  id: number,
  input: UpdateCountryParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await getCountryById(id);

  if (input.name || input.code) {
    await assertNameAndCodeAvailable(input.name ?? existing.name, input.code ?? existing.code, id);
  }

  const country = await prisma.country.update({
    where: { id },
    data: { ...input },
  });

  await createLog({
    adminId: actorId,
    description: `Updated country "${country.name}" (id ${country.id})`,
    ipAddress,
  });

  return country;
}

export async function updateCountryStatus(
  id: number,
  isActive: boolean,
  actorId: number,
  ipAddress?: string | null,
) {
  await getCountryById(id);

  const country = await prisma.country.update({
    where: { id },
    data: { isActive },
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} country "${country.name}" (id ${id})`,
    ipAddress,
  });

  return country;
}

export async function deleteCountry(id: number, actorId: number, ipAddress?: string | null) {
  const country = await getCountryById(id);

  // A country with states under it can't be deleted outright — same
  // "protect referenced parent rows" rule as role.service.ts's
  // deleteRole (childCount / adminCount checks).
  const stateCount = await prisma.state.count({ where: { countryId: id } });
  if (stateCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this country — ${stateCount} state(s) are linked to it. Delete or reassign them first.`,
    );
  }

  // Same rule for brands whose countryOriginId points to this country —
  // same pattern as brand.service.ts's deleteBrand (carModelCount check).
  const brandCount = await prisma.brand.count({ where: { countryOriginId: id } });
  if (brandCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this country — ${brandCount} brand(s) are linked to it. Delete or reassign them first.`,
    );
  }

  await prisma.country.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted country "${country.name}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Country deleted successfully' };
}