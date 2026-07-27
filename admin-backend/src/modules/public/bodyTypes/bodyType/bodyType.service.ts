// src/modules/public/bodyTypes/bodyType/bodyType.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { HOME_CAR_SELECT, shapeHomeCarModel } from '@/modules/public/home/car/car.service';
import type { PublicHomeCarRecord } from '@/modules/public/home/car/car.types';
import type { BodyTypeCarsQueryParsed } from './bodyType.validation';
import type { BodyTypeDetail, BodyTypeWithCount } from './bodyType.types';

// Same numeric codes as compare.service.ts / brand.service.ts — see
// those files' comments for why this is duplicated rather than shared.
const FUEL_FILTER_CODES: Record<'petrol' | 'diesel' | 'cng', number> = {
  petrol: 1,
  diesel: 2,
  cng: 3,
};

export interface BodyTypeCarsFilters {
  page: number;
  limit: number;
  brandSlugs?: string[];
  fuelTypes?: ('petrol' | 'diesel' | 'cng' | 'electric')[];
  minPrice?: number;
  maxPrice?: number;
  sort: BodyTypeCarsQueryParsed['sort'];
}

export interface BodyTypeCarsResult {
  bodyType: BodyTypeDetail;
  cars: PublicHomeCarRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: {
    brands: { id: number; name: string; slug: string; count: number }[];
    fuelTypes: { value: string; label: string; count: number }[];
    priceRange: { min: string; max: string };
  };
}

// "Explore other body types" nav — every body type with how many
// available cars it has, so a 0-count type can be skipped/greyed out by
// the caller instead of linking to an empty listing.
export async function listAllBodyTypesWithCounts(): Promise<BodyTypeWithCount[]> {
  const [bodyTypes, counts] = await Promise.all([
    prisma.bodyType.findMany({ select: { id: true, name: true, slug: true, iconUrl: true }, orderBy: { name: 'asc' } }),
    prisma.carModel.groupBy({ by: ['bodyTypeId'], where: { launchStatus: 'available' }, _count: { _all: true } }),
  ]);

  const countByBodyTypeId = new Map(counts.map((c) => [c.bodyTypeId, c._count._all]));
  return bodyTypes.map((bt) => ({ ...bt, count: countByBodyTypeId.get(bt.id) ?? 0 }));
}

export async function getBodyTypeBySlug(slug: string): Promise<BodyTypeDetail> {
  const bodyType = await prisma.bodyType.findFirst({
    where: { slug },
    select: { id: true, name: true, slug: true, iconUrl: true, description: true },
  });
  if (!bodyType) throw ApiError.notFound(`Body type "${slug}" not found`);
  return bodyType;
}

function buildBodyTypeCarsWhere(
  bodyTypeId: number,
  filters: Omit<BodyTypeCarsFilters, 'page' | 'limit' | 'sort'>,
): Prisma.CarModelWhereInput {
  const where: Prisma.CarModelWhereInput = { bodyTypeId, launchStatus: 'available' };

  if (filters.brandSlugs?.length) {
    where.brand = { slug: { in: filters.brandSlugs } };
  }

  if (filters.fuelTypes?.length) {
    const or: Prisma.CarModelWhereInput[] = [];
    for (const fuel of filters.fuelTypes) {
      if (fuel === 'electric') {
        or.push({ variants: { some: { electricPowertrains: { some: {} } } } });
      } else {
        or.push({ variants: { some: { icePowertrains: { some: { fuelType: FUEL_FILTER_CODES[fuel] } } } } });
      }
    }
    if (or.length) where.OR = or;
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.priceMin = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  return where;
}

function buildSortOrderBy(sort: BodyTypeCarsFilters['sort']): Prisma.CarModelOrderByWithRelationInput[] {
  switch (sort) {
    case 'price-asc':
      return [{ priceMin: 'asc' }];
    case 'price-desc':
      return [{ priceMin: 'desc' }];
    case 'rating':
      return [{ ratingAvg: { sort: 'desc', nulls: 'last' } }];
    case 'popularity':
    default:
      return [{ ratingAvg: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }];
  }
}

// Cross-filtered, same idea as brand.service.ts's getBodyTypeCounts/getFuelTypeCounts.
async function getBrandCounts(bodyTypeId: number, filters: BodyTypeCarsFilters) {
  const where = buildBodyTypeCarsWhere(bodyTypeId, { ...filters, brandSlugs: undefined });

  const groups = await prisma.carModel.groupBy({ by: ['brandId'], where, _count: { _all: true } });
  if (groups.length === 0) return [];

  const brands = await prisma.brand.findMany({
    where: { id: { in: groups.map((g) => g.brandId) } },
    select: { id: true, name: true, slug: true },
  });
  const byId = new Map(brands.map((b) => [b.id, b]));

  return groups
    .filter((g) => byId.has(g.brandId))
    .map((g) => ({ ...byId.get(g.brandId)!, count: g._count._all }))
    .sort((a, b) => b.count - a.count);
}

async function getFuelTypeCounts(bodyTypeId: number, filters: BodyTypeCarsFilters) {
  const where = buildBodyTypeCarsWhere(bodyTypeId, { ...filters, fuelTypes: undefined });

  const [petrol, diesel, cng, electric] = await Promise.all([
    prisma.carModel.count({ where: { ...where, variants: { some: { icePowertrains: { some: { fuelType: 1 } } } } } }),
    prisma.carModel.count({ where: { ...where, variants: { some: { icePowertrains: { some: { fuelType: 2 } } } } } }),
    prisma.carModel.count({ where: { ...where, variants: { some: { icePowertrains: { some: { fuelType: 3 } } } } } }),
    prisma.carModel.count({ where: { ...where, variants: { some: { electricPowertrains: { some: {} } } } } }),
  ]);

  return [
    { value: 'petrol', label: 'Petrol', count: petrol },
    { value: 'diesel', label: 'Diesel', count: diesel },
    { value: 'cng', label: 'CNG', count: cng },
    { value: 'electric', label: 'Electric', count: electric },
  ].filter((f) => f.count > 0);
}

export async function listBodyTypeCars(slug: string, filters: BodyTypeCarsFilters): Promise<BodyTypeCarsResult> {
  const bodyType = await getBodyTypeBySlug(slug);
  const where = buildBodyTypeCarsWhere(bodyType.id, filters);
  const orderBy = buildSortOrderBy(filters.sort);

  const [items, total, brands, fuelTypes, priceBounds] = await Promise.all([
    prisma.carModel.findMany({
      where,
      select: HOME_CAR_SELECT,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.carModel.count({ where }),
    getBrandCounts(bodyType.id, filters),
    getFuelTypeCounts(bodyType.id, filters),
    prisma.carModel.aggregate({
      where: { bodyTypeId: bodyType.id, launchStatus: 'available' },
      _min: { priceMin: true },
      _max: { priceMax: true },
    }),
  ]);

  return {
    bodyType,
    cars: items.map(shapeHomeCarModel),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit) || 1,
    },
    filters: {
      brands,
      fuelTypes,
      priceRange: {
        min: priceBounds._min.priceMin?.toString() ?? '0',
        max: priceBounds._max.priceMax?.toString() ?? '0',
      },
    },
  };
}
