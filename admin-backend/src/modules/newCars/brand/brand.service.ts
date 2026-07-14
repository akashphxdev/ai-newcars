// src/modules/cars/brand/brand.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  BrandListQueryParsed,
  BrandOptionsQueryParsed,
  CreateBrandParsed,
  UpdateBrandParsed,
  UpdateBrandStatusParsed,
} from './brand.validation';
import type { BrandUploadLogoResult } from './brand.types';

const BRAND_SELECT = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  countryOriginId: true,
  isActive: true,
  createdAt: true,
  countryOrigin: {
    select: { id: true, name: true },
  },
} as const;

export async function listBrands(query: BrandListQueryParsed) {
  const { page, limit, search, countryOriginId, isActive, sortBy, sortOrder } = query;

  const where: Prisma.BrandWhereInput = {
    ...(countryOriginId ? { countryOriginId } : {}),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
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
    prisma.brand.findMany({
      where,
      select: BRAND_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.brand.count({ where }),
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

// Dropdown-only source — every matching brand in one shot, no
// pagination. Use this (not listBrands) wherever Brand is just a
// <select>: CarModel/Variant/Powertrain/Article forms & filters.
export async function listBrandOptions(query: BrandOptionsQueryParsed) {
  const { isActive } = query;

  const where: Prisma.BrandWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
  };

  return prisma.brand.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function getBrandById(id: number) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    select: BRAND_SELECT,
  });

  if (!brand) {
    throw ApiError.notFound('Brand not found');
  }

  return brand;
}

async function assertCountryExists(countryId: number) {
  const country = await prisma.country.findUnique({ where: { id: countryId }, select: { id: true } });
  if (!country) {
    throw ApiError.badRequest('Invalid countryOriginId — country does not exist');
  }
}

// `slug` IS @unique in schema.prisma (DB-level) — same pattern as
// city.service.ts's assertSlugAvailable.
async function assertSlugAvailable(slug: string, excludeId?: number) {
  const conflict = await prisma.brand.findFirst({
    where: { slug, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`A brand with the slug "${slug}" already exists`);
  }
}
export async function createBrand(input: CreateBrandParsed, actorId: number, logoFilename: string) {
  if (input.countryOriginId) {
    await assertCountryExists(input.countryOriginId);
  }

  await assertSlugAvailable(input.slug);

  const brand = await prisma.brand.create({
    data: {
      name: input.name,
      slug: input.slug,
      countryOriginId: input.countryOriginId,
      isActive: input.isActive ?? true,
      // Logo is required on create — controller already rejects the
      // request before this point if no file was uploaded.
      logoUrl: buildPublicPath('brands', logoFilename),
    },
    select: BRAND_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created brand "${brand.name}" (id ${brand.id}, slug "${brand.slug}")`,
  });

  return brand;
}

export async function updateBrand(id: number, input: UpdateBrandParsed, actorId: number) {
  const existing = await getBrandById(id);

  if (typeof input.countryOriginId === 'number') {
    await assertCountryExists(input.countryOriginId);
  }

  // Slug is required in the payload now — the frontend always sends the
  // literal value it's showing the admin, so just validate it's free.
  if (input.slug !== existing.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...input,
      countryOriginId: input.countryOriginId,
    },
    select: BRAND_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated brand "${brand.name}" (id ${brand.id})`,
  });

  return brand;
}
export async function updateBrandStatus(id: number, isActive: boolean, actorId: number) {
  await getBrandById(id);

  const brand = await prisma.brand.update({
    where: { id },
    data: { isActive },
    select: BRAND_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} brand "${brand.name}" (id ${id})`,
  });

  return brand;
}

export async function deleteBrand(id: number, actorId: number) {
  const brand = await getBrandById(id);

  const carModelCount = await prisma.carModel.count({ where: { brandId: id } });
  if (carModelCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this brand — ${carModelCount} car model(s) are linked to it. Delete or reassign them first.`,
    );
  }

  await prisma.brand.delete({ where: { id } });

  // Brand row is gone — its logo file on disk (if any) is now orphaned,
  // clean it up. Same order-of-operations as city.service.ts's deleteCity.
  await deleteUploadedFile(brand.logoUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted brand "${brand.name}" (id ${id})`,
  });

  return { message: 'Brand deleted successfully' };
}

export async function uploadBrandLogo(
  id: number,
  savedFilename: string,
  actorId: number,
): Promise<BrandUploadLogoResult> {
  const existing = await getBrandById(id);

  const newLogoUrl = buildPublicPath('brands', savedFilename);

  const brand = await prisma.brand.update({
    where: { id },
    data: { logoUrl: newLogoUrl },
    select: { id: true, logoUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds — if the update
  // had failed we'd want the old logo to remain intact.
  await deleteUploadedFile(existing.logoUrl);

  await createLog({
    adminId: actorId,
    description: `Updated logo for brand "${existing.name}" (id ${id})`,
  });

  return brand as BrandUploadLogoResult;
}