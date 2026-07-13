// src/modules/locations/city/city.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { slugify } from '@/core/utils/slugify';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type { CityListQueryParsed, CreateCityParsed, UpdateCityParsed, UpdateCityFlagsParsed } from './city.validation';
import type { CityUploadLogoResult } from './city.types';

const CITY_SELECT = {
  id: true,
  districtId: true,
  name: true,
  slug: true,
  isMetro: true,
  isTopCity: true,
  isSellCarEnabled: true,
  logoUrl: true,
  district: {
    select: {
      id: true,
      name: true,
      state: {
        select: {
          id: true,
          name: true,
          country: { select: { id: true, name: true } },
        },
      },
    },
  },
} as const;

export async function listCities(query: CityListQueryParsed) {
  const { page, limit, search, districtId, stateId, isMetro, sortBy, sortOrder } = query;

  const where: Prisma.CityWhereInput = {
    ...(districtId ? { districtId } : {}),
    ...(stateId ? { district: { stateId } } : {}),
    ...(typeof isMetro === 'boolean' ? { isMetro } : {}),
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
    prisma.city.findMany({
      where,
      select: CITY_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.city.count({ where }),
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

export async function getCityById(id: number) {
  const city = await prisma.city.findUnique({
    where: { id },
    select: CITY_SELECT,
  });

  if (!city) {
    throw ApiError.notFound('City not found');
  }

  return city;
}

async function assertDistrictExists(districtId: number) {
  const district = await prisma.district.findUnique({ where: { id: districtId }, select: { id: true } });
  if (!district) {
    throw ApiError.badRequest('Invalid districtId — district does not exist');
  }
}

async function assertSlugAvailable(slug: string, excludeId?: number) {
  const conflict = await prisma.city.findFirst({
    where: { slug, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`A city with the slug "${slug}" already exists`);
  }
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  // Bounded loop — 50 attempts is far more than any real name collision
  // will ever need; guards against an infinite loop if something odd happens.
  for (let attempts = 0; attempts < 50; attempts++) {
    const existing = await prisma.city.findFirst({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  throw ApiError.internal('Could not generate a unique slug — please provide one manually');
}

export async function createCity(input: CreateCityParsed, logoFilename: string, actorId: number) {
  await assertDistrictExists(input.districtId);

  const slug = input.slug ? input.slug : await generateUniqueSlug(input.name);
  if (input.slug) {
    await assertSlugAvailable(slug);
  }

  const city = await prisma.city.create({
    data: {
      districtId: input.districtId,
      name: input.name,
      slug,
      isMetro: input.isMetro ?? false,
      isTopCity: input.isTopCity ?? false,
      isSellCarEnabled: input.isSellCarEnabled ?? false,
      logoUrl: buildPublicPath('cities', logoFilename),
    },
    select: CITY_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created city "${city.name}" (id ${city.id}, slug "${city.slug}") under district "${city.district.name}"`,
  });

  return city;
}

export async function updateCity(id: number, input: UpdateCityParsed, actorId: number) {
  const existing = await getCityById(id);

  if (input.districtId) {
    await assertDistrictExists(input.districtId);
  }
  if (input.slug && input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  const city = await prisma.city.update({
    where: { id },
    data: { ...input },
    select: CITY_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated city "${city.name}" (id ${city.id}) — fields: ${Object.keys(input).join(', ')}`,
  });

  return city;
}

export async function updateCityFlags(id: number, flags: UpdateCityFlagsParsed, actorId: number) {
  await getCityById(id);

  const city = await prisma.city.update({
    where: { id },
    data: { ...flags },
    select: CITY_SELECT,
  });

  const changedFlags = Object.entries(flags)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');

  await createLog({
    adminId: actorId,
    description: `Updated flags for city "${city.name}" (id ${id}) — ${changedFlags}`,
  });

  return city;
}

export async function deleteCity(id: number, actorId: number) {
  const city = await getCityById(id);
  const [listingCount, userCount, addressCount] = await Promise.all([
    prisma.usedCarListing.count({ where: { cityId: id } }),
    prisma.user.count({ where: { cityId: id } }),
    // UserAddress.cityId is a RESTRICT FK (unlike User.cityId, which is
    // SET NULL) — without this check, deleting a city with addresses
    // still on it would fail with a raw DB foreign-key error instead of
    // this friendly message.
    prisma.userAddress.count({ where: { cityId: id } }),
  ]);

  if (listingCount > 0 || userCount > 0 || addressCount > 0) {
    const parts: string[] = [];
    if (listingCount > 0) parts.push(`${listingCount} used-car listing(s)`);
    if (userCount > 0) parts.push(`${userCount} user(s)`);
    if (addressCount > 0) parts.push(`${addressCount} user address(es)`);
    throw ApiError.badRequest(
      `Cannot delete this city — ${parts.join(', ')} are linked to it. Reassign or remove them first.`,
    );
  }

  await prisma.city.delete({ where: { id } });

  // City row is gone — its logo file on disk is now orphaned, clean it up.
  await deleteUploadedFile(city.logoUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted city "${city.name}" (id ${id})`,
  });

  return { message: 'City deleted successfully' };
}
export async function uploadCityLogo(
  id: number,
  savedFilename: string,
  actorId: number,
): Promise<CityUploadLogoResult> {
  const existing = await getCityById(id);

  const newLogoUrl = buildPublicPath('cities', savedFilename);

  const city = await prisma.city.update({
    where: { id },
    data: { logoUrl: newLogoUrl },
    select: { id: true, logoUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds — if the update
  // had failed we'd want the old logo to remain intact.
  await deleteUploadedFile(existing.logoUrl);

  await createLog({
    adminId: actorId,
    description: `Updated logo for city "${existing.name}" (id ${id})`,
  });

  return city as CityUploadLogoResult;
}