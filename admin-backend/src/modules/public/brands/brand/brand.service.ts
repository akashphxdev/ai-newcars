// src/modules/public/brands/brand/brand.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { HOME_CAR_SELECT, shapeHomeCarModel } from '@/modules/public/home/car/car.service';
import type { PublicHomeCarRecord } from '@/modules/public/home/car/car.types';
import type { PublicHomeArticleRecord } from '@/modules/public/home/article/article.types';
import type { BrandListQueryParsed, BrandCarsQueryParsed } from './brand.validation';
import type { PublicHomeBrandRecord } from '@/modules/public/home/brand/brand.types';

// Same numeric codes as compare.service.ts's FUEL_TYPE_LABELS/FUEL_FILTER_CODES
// — duplicated rather than imported for the same reason noted there: this
// is a small, module-local concern, not worth a cross-module dependency.
const FUEL_FILTER_CODES: Record<'petrol' | 'diesel' | 'cng', number> = {
  petrol: 1,
  diesel: 2,
  cng: 3,
};

export interface BrandCarsFilters {
  page: number;
  limit: number;
  bodyTypeSlugs?: string[];
  fuelTypes?: ('petrol' | 'diesel' | 'cng' | 'electric')[];
  minPrice?: number;
  maxPrice?: number;
  sort: BrandCarsQueryParsed['sort'];
}

export interface BrandDetail {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface BrandCarsResult {
  brand: BrandDetail;
  cars: PublicHomeCarRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: {
    bodyTypes: { id: number; name: string; slug: string; count: number }[];
    fuelTypes: { value: string; label: string; count: number }[];
    priceRange: { min: string; max: string };
  };
}

// "View all brands" page — every active brand in one shot. Brand counts
// are naturally small and bounded (unlike articles/cars), so a plain
// unpaginated list with an optional name search is enough; no need for
// page/limit like the admin listing.
export async function listAllBrands(query: BrandListQueryParsed): Promise<PublicHomeBrandRecord[]> {
  const { search } = query;

  const where: Prisma.BrandWhereInput = {
    isActive: true,
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };

  return prisma.brand.findMany({
    where,
    select: { id: true, name: true, slug: true, logoUrl: true },
    orderBy: { name: 'asc' },
  });
}

export interface BrandWithCount {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  count: number;
}

// "Explore other brands" nav — every active brand with how many
// available cars it has, so a 0-count brand can be skipped by the
// caller instead of linking to an empty listing. Deliberately a
// separate function from listAllBrands (used by the /brands index page,
// which doesn't need counts and supports a name search instead).
export async function listAllBrandsWithCounts(): Promise<BrandWithCount[]> {
  const [brands, counts] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true, logoUrl: true }, orderBy: { name: 'asc' } }),
    prisma.carModel.groupBy({ by: ['brandId'], where: { launchStatus: 'available' }, _count: { _all: true } }),
  ]);

  const countByBrandId = new Map(counts.map((c) => [c.brandId, c._count._all]));
  return brands.map((b) => ({ ...b, count: countByBrandId.get(b.id) ?? 0 }));
}

export async function getBrandBySlug(slug: string): Promise<BrandDetail> {
  const brand = await prisma.brand.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });
  if (!brand) throw ApiError.notFound(`Brand "${slug}" not found`);
  return brand;
}

function buildBrandCarsWhere(brandId: number, filters: Omit<BrandCarsFilters, 'page' | 'limit' | 'sort'>): Prisma.CarModelWhereInput {
  const where: Prisma.CarModelWhereInput = { brandId, launchStatus: 'available' };

  if (filters.bodyTypeSlugs?.length) {
    where.bodyType = { slug: { in: filters.bodyTypeSlugs } };
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

function buildSortOrderBy(sort: BrandCarsFilters['sort']): Prisma.CarModelOrderByWithRelationInput[] {
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

// Counts are cross-filtered — e.g. body-type counts reflect the
// currently selected fuel/price filters (but ignore the body-type
// selection itself), same idea a shopping-site filter sidebar uses so
// the numbers next to each checkbox stay meaningful as other filters
// are applied.
async function getBodyTypeCounts(brandId: number, filters: BrandCarsFilters) {
  const where = buildBrandCarsWhere(brandId, { ...filters, bodyTypeSlugs: undefined });

  const groups = await prisma.carModel.groupBy({
    by: ['bodyTypeId'],
    where,
    _count: { _all: true },
  });

  const ids = groups.map((g) => g.bodyTypeId).filter((id): id is number => id != null);
  if (ids.length === 0) return [];

  const bodyTypes = await prisma.bodyType.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true },
  });
  const bySlugId = new Map(bodyTypes.map((b) => [b.id, b]));

  return groups
    .filter((g) => g.bodyTypeId != null && bySlugId.has(g.bodyTypeId))
    .map((g) => ({ ...bySlugId.get(g.bodyTypeId!)!, count: g._count._all }))
    .sort((a, b) => b.count - a.count);
}

async function getFuelTypeCounts(brandId: number, filters: BrandCarsFilters) {
  const where = buildBrandCarsWhere(brandId, { ...filters, fuelTypes: undefined });

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

export async function listBrandCars(slug: string, filters: BrandCarsFilters): Promise<BrandCarsResult> {
  const brand = await getBrandBySlug(slug);
  const where = buildBrandCarsWhere(brand.id, filters);
  const orderBy = buildSortOrderBy(filters.sort);

  const [items, total, bodyTypes, fuelTypes, priceBounds] = await Promise.all([
    prisma.carModel.findMany({
      where,
      select: HOME_CAR_SELECT,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.carModel.count({ where }),
    getBodyTypeCounts(brand.id, filters),
    getFuelTypeCounts(brand.id, filters),
    prisma.carModel.aggregate({
      where: { brandId: brand.id, launchStatus: 'available' },
      _min: { priceMin: true },
      _max: { priceMax: true },
    }),
  ]);

  return {
    brand,
    cars: items.map(shapeHomeCarModel),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit) || 1,
    },
    filters: {
      bodyTypes,
      fuelTypes,
      priceRange: {
        min: priceBounds._min.priceMin?.toString() ?? '0',
        max: priceBounds._max.priceMax?.toString() ?? '0',
      },
    },
  };
}

// "Articles about this brand" — via the ArticleBrand join table (an
// article can cover multiple brands, e.g. a comparison piece, so this
// isn't a plain brandId column on Article).
export async function listBrandArticles(slug: string, limit = 6): Promise<PublicHomeArticleRecord[]> {
  const brand = await getBrandBySlug(slug);

  const articles = await prisma.article.findMany({
    where: {
      status: 'published',
      isActive: true,
      articleBrands: { some: { brandId: brand.id } },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      readTimeMinutes: true,
      publishedAt: true,
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });

  return articles.map((a) => ({ ...a, publishedAt: a.publishedAt?.toISOString() ?? null }));
}
