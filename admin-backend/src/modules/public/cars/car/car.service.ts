// src/modules/public/cars/car/car.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { HOME_CAR_SELECT, shapeHomeCarModel, buildHomeCarWhereAndOrderBy } from '@/modules/public/home/car/car.service';
import type { PublicHomeCarRecord } from '@/modules/public/home/car/car.types';
import type { CarListQueryParsed, CarsBrowseQueryParsed } from './car.validation';

// Same numeric codes as compare.service.ts's FUEL_TYPE_LABELS — duplicated
// for the same module-local reason noted there.
const FUEL_TYPE_LABELS: Record<number, string> = {
  1: 'Petrol',
  2: 'Diesel',
  3: 'CNG',
  4: 'LPG',
  5: 'Hybrid',
};

// Same numeric codes as compare/brand/bodyType services — duplicated for
// the same reason noted there (small, module-local concern).
const FUEL_FILTER_CODES: Record<'petrol' | 'diesel' | 'cng', number> = {
  petrol: 1,
  diesel: 2,
  cng: 3,
};

// getCarDetail's initial payload only ships this many variants (cheapest/
// top-seller first) — the model-detail page's "View All" expansion and
// the Write Review form both pull the rest from getCarVariants instead,
// so the first page load doesn't have to carry every variant up front.
const VARIANT_OPTIONS_PREVIEW_LIMIT = 5;

// Select shape for a variant's assigned features — reused by
// compare.service.ts (imported from here) so both public endpoints stay
// in sync with the VariantFeature schema.
export const VARIANT_FEATURES_SELECT = {
  select: {
    value: true,
    feature: {
      select: {
        id: true,
        name: true,
        category: { select: { id: true, name: true, sortOrder: true } },
      },
    },
  },
} as const;

type VariantFeatureRow = {
  value: string | null;
  feature: { id: number; name: string; category: { id: number; name: string; sortOrder: number } | null };
};

// Groups a variant's flat VariantFeature rows by category, sorted by
// each category's sortOrder — uncategorized features land in a
// trailing "Other" bucket instead of being dropped.
export function shapeVariantFeatures(rows: VariantFeatureRow[]): CarDetailFeatureGroup[] {
  const groups = new Map<string, CarDetailFeatureGroup & { sortOrder: number }>();

  for (const row of rows) {
    const key = row.feature.category ? String(row.feature.category.id) : 'other';
    if (!groups.has(key)) {
      groups.set(key, {
        categoryId: row.feature.category?.id ?? null,
        categoryName: row.feature.category?.name ?? 'Other',
        sortOrder: row.feature.category?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        items: [],
      });
    }
    groups.get(key)!.items.push({ id: row.feature.id, name: row.feature.name, value: row.value });
  }

  return Array.from(groups.values())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ categoryId, categoryName, items }) => ({ categoryId, categoryName, items }));
}

// "View all [type] cars" page — same filter/sort rules as the homepage
// rail for that type (modules/public/home/car), just paginated instead
// of a fixed take: N.
export async function listAllCars(query: CarListQueryParsed): Promise<{
  items: PublicHomeCarRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { type, page, limit } = query;
  const { where, orderBy } = buildHomeCarWhereAndOrderBy(type);

  const [items, total] = await Promise.all([
    prisma.carModel.findMany({
      where,
      select: HOME_CAR_SELECT,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carModel.count({ where }),
  ]);

  return {
    items: items.map(shapeHomeCarModel),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export interface BrowseCarsFilters {
  page: number;
  limit: number;
  brandSlugs?: string[];
  bodyTypeSlugs?: string[];
  fuelTypes?: ('petrol' | 'diesel' | 'cng' | 'electric')[];
  minPrice?: number;
  maxPrice?: number;
  sort: CarsBrowseQueryParsed['sort'];
  launchStatus: CarsBrowseQueryParsed['launchStatus'];
}

export interface BrowseCarsResult {
  cars: PublicHomeCarRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: {
    brands: { id: number; name: string; slug: string; count: number }[];
    bodyTypes: { id: number; name: string; slug: string; count: number }[];
    fuelTypes: { value: string; label: string; count: number }[];
    priceRange: { min: string; max: string };
  };
}

function buildBrowseCarsWhere(filters: Omit<BrowseCarsFilters, 'page' | 'limit' | 'sort'>): Prisma.CarModelWhereInput {
  const where: Prisma.CarModelWhereInput = { launchStatus: filters.launchStatus };

  if (filters.brandSlugs?.length) {
    where.brand = { slug: { in: filters.brandSlugs } };
  }

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

function buildBrowseSortOrderBy(sort: BrowseCarsFilters['sort']): Prisma.CarModelOrderByWithRelationInput[] {
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

// Cross-filtered, same pattern as brand.service.ts / bodyType.service.ts.
async function getBrowseBrandCounts(filters: BrowseCarsFilters) {
  const where = buildBrowseCarsWhere({ ...filters, brandSlugs: undefined });
  const groups = await prisma.carModel.groupBy({ by: ['brandId'], where, _count: { _all: true } });
  if (groups.length === 0) return [];

  const brands = await prisma.brand.findMany({ where: { id: { in: groups.map((g) => g.brandId) } }, select: { id: true, name: true, slug: true } });
  const byId = new Map(brands.map((b) => [b.id, b]));
  return groups
    .filter((g) => byId.has(g.brandId))
    .map((g) => ({ ...byId.get(g.brandId)!, count: g._count._all }))
    .sort((a, b) => b.count - a.count);
}

async function getBrowseBodyTypeCounts(filters: BrowseCarsFilters) {
  const where = buildBrowseCarsWhere({ ...filters, bodyTypeSlugs: undefined });
  const groups = await prisma.carModel.groupBy({ by: ['bodyTypeId'], where, _count: { _all: true } });
  const ids = groups.map((g) => g.bodyTypeId).filter((id): id is number => id != null);
  if (ids.length === 0) return [];

  const bodyTypes = await prisma.bodyType.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, slug: true } });
  const byId = new Map(bodyTypes.map((b) => [b.id, b]));
  return groups
    .filter((g) => g.bodyTypeId != null && byId.has(g.bodyTypeId))
    .map((g) => ({ ...byId.get(g.bodyTypeId!)!, count: g._count._all }))
    .sort((a, b) => b.count - a.count);
}

async function getBrowseFuelTypeCounts(filters: BrowseCarsFilters) {
  const where = buildBrowseCarsWhere({ ...filters, fuelTypes: undefined });
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

// "/new-cars" — the un-scoped browse page. Price bounds are computed
// across ALL available cars (not just the current filter selection) so
// the slider's range stays stable as other filters change.
export async function browseCars(filters: BrowseCarsFilters): Promise<BrowseCarsResult> {
  const where = buildBrowseCarsWhere(filters);
  const orderBy = buildBrowseSortOrderBy(filters.sort);

  const [items, total, brands, bodyTypes, fuelTypes, priceBounds] = await Promise.all([
    prisma.carModel.findMany({
      where,
      select: HOME_CAR_SELECT,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.carModel.count({ where }),
    getBrowseBrandCounts(filters),
    getBrowseBodyTypeCounts(filters),
    getBrowseFuelTypeCounts(filters),
    prisma.carModel.aggregate({ where: { launchStatus: filters.launchStatus }, _min: { priceMin: true }, _max: { priceMax: true } }),
  ]);

  return {
    cars: items.map(shapeHomeCarModel),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit) || 1,
    },
    filters: {
      brands,
      bodyTypes,
      fuelTypes,
      priceRange: {
        min: priceBounds._min.priceMin?.toString() ?? '0',
        max: priceBounds._max.priceMax?.toString() ?? '0',
      },
    },
  };
}

// Car model detail page ("/tata/punch-ev") — Overview/Price/Compare/Images/
// Specs/Variants tabs all render from this one payload. Deliberately fuller
// than compare.service.ts's getCarWithVariant (that one is a curated
// comparison subset); this needs the complete spec sheet.
export interface CarDetailVariantOption {
  id: number;
  variantName: string;
  price: string;
  isTopSeller: boolean;
}

export interface CarDetailIceSpecs {
  fuelType: string | null;
  fuelTypeSubCategory: string | null;
  fuelTankCapacity: string | null;
  cngTankCapacity: string | null;
  kerbWeight: number | null;
  engineDisplacement: string | null;
  cubicCapacity: number | null;
  cylinders: number | null;
  numGears: number | null;
  isFourByFour: boolean;
  drivetrain: string | null;
  powerPs: number | null;
  powerMinRpm: number | null;
  powerMaxRpm: number | null;
  torqueNm: number | null;
  torqueMinRpm: number | null;
  torqueMaxRpm: number | null;
  claimedFe: string | null;
  realWorldMileage: string | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
  emissionNormCompliance: string | null;
  turboCharger: boolean;
}

export interface CarDetailElectricSpecs {
  numMotors: number | null;
  motorType: string | null;
  batteryCapacity: string | null;
  batteryChemistry: string | null;
  thermalManagementSystem: string | null;
  drivetrain: string | null;
  powerPs: number | null;
  torqueNm: number | null;
  claimedRange: number | null;
  realWorldRange: number | null;
  topSpeedKmph: number | null;
  topSpeedTimeSec: string | null;
  acChargingOutput: string | null;
  acChargingTime: string | null;
  dcChargingOutput: string | null;
  dcFastChargingTime: string | null;
  batteryWarrantyKm: number | null;
  batteryWarrantyYears: number | null;
  motorWarrantyKm: number | null;
  motorWarrantyYears: number | null;
  standardWarrantyKm: string | null;
  standardWarrantyYears: number | null;
  emissionNormCompliance: string | null;
  motorPowerKw: string | null;
  chargingPort: string | null;
  chargingOptionsRaw: string | null;
  regenerativeBraking: boolean;
  regenerativeBrakingLevels: number | null;
}

// Shared across both ICE and Electric variants (chassis-level, not
// powertrain-specific) — see car-detail schema notes on why these live
// on CarVariant instead of being duplicated into both powertrain tables.
export interface CarDetailVariantDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
  wheelBase: number | null;
  groundClearance: number | null;
  bootSpace: number | null;
  frontSuspension: string | null;
  rearSuspension: string | null;
  steeringType: string | null;
  frontBrakeType: string | null;
  rearBrakeType: string | null;
}

export interface CarDetailFeatureItem {
  id: number;
  name: string;
  value: string | null;
}

export interface CarDetailFeatureGroup {
  categoryId: number | null;
  categoryName: string;
  items: CarDetailFeatureItem[];
}

export interface CarDetailSelectedVariant {
  id: number;
  variantName: string;
  price: string;
  seatingCapacity: number;
  transmission: string | null;
  isElectric: boolean;
  ice: CarDetailIceSpecs | null;
  electric: CarDetailElectricSpecs | null;
  dimensions: CarDetailVariantDimensions;
  features: CarDetailFeatureGroup[];
}

export interface CarDetailImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  angle: string | null;
  colorId: number | null;
}

export interface CarDetailColor {
  id: number;
  colorName: string;
  imageUrl: string | null;
  additionalCost: string | null;
  shades: { colorHex: string; sortOrder: number }[];
}

export interface CarDetailResult {
  id: number;
  name: string;
  slug: string;
  brand: { id: number; name: string; slug: string; logoUrl: string | null };
  bodyType: { id: number; name: string; slug: string } | null;
  launchStatus: string;
  expectedLaunchDate: string | null;
  priceMin: string | null;
  priceMax: string | null;
  ratingAvg: string | null;
  coverImageUrl: string | null;
  variantOptions: CarDetailVariantOption[];
  // Total variant count for the model — variantOptions above is capped to
  // VARIANT_OPTIONS_PREVIEW_LIMIT, so the page needs this to know whether
  // a "View All" expansion has anything more to fetch.
  variantCount: number;
  selectedVariant: CarDetailSelectedVariant | null;
  images: CarDetailImage[];
  colors: CarDetailColor[];
}

export async function getCarDetail(brandSlug: string, modelSlug: string, variantId?: number): Promise<CarDetailResult> {
  const car = await prisma.carModel.findFirst({
    where: { slug: modelSlug, brand: { slug: brandSlug, isActive: true } },
    select: {
      id: true,
      name: true,
      slug: true,
      brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
      bodyType: { select: { id: true, name: true, slug: true } },
      launchStatus: true,
      expectedLaunchDate: true,
      priceMin: true,
      priceMax: true,
      ratingAvg: true,
      coverImageUrl: true,
      variants: {
        select: { id: true, variantName: true, price: true, isTopSeller: true },
        orderBy: [{ isTopSeller: 'desc' }, { price: 'asc' }],
        take: VARIANT_OPTIONS_PREVIEW_LIMIT,
      },
      _count: { select: { variants: true } },
      images: {
        select: { id: true, imageUrl: true, isPrimary: true, angle: true, colorId: true },
        orderBy: { isPrimary: 'desc' },
      },
      colors: {
        select: {
          id: true,
          colorName: true,
          imageUrl: true,
          additionalCost: true,
          shades: { select: { colorHex: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  if (!car) throw ApiError.notFound(`Car "${brandSlug}/${modelSlug}" not found`);

  const chosenVariantId = variantId ?? car.variants[0]?.id;
  let selectedVariant: CarDetailSelectedVariant | null = null;

  if (chosenVariantId) {
    const variant = await prisma.carVariant.findFirst({
      where: { id: chosenVariantId, modelId: car.id },
      select: {
        id: true,
        variantName: true,
        price: true,
        seatingCapacity: true,
        transmission: { select: { name: true } },
        length: true,
        width: true,
        height: true,
        wheelBase: true,
        groundClearance: true,
        bootSpace: true,
        frontSuspension: true,
        rearSuspension: true,
        steeringType: true,
        frontBrakeType: true,
        rearBrakeType: true,
        icePowertrains: {
          where: { isDeleted: false },
          orderBy: { isDefault: 'desc' },
          take: 1,
          select: {
            fuelType: true,
            fuelTypeSubCategory: true,
            fuelTankCapacity: true,
            cngTankCapacity: true,
            kerbWeight: true,
            engineDisplacement: true,
            cubicCapacity: true,
            cylinders: true,
            numGears: true,
            isFourByFour: true,
            drivetrain: { select: { name: true } },
            powerPs: true,
            powerMinRpm: true,
            powerMaxRpm: true,
            torqueNm: true,
            torqueMinRpm: true,
            torqueMaxRpm: true,
            claimedFe: true,
            realWorldMileage: true,
            topSpeedKmph: true,
            topSpeedTimeSec: true,
            emissionNormCompliance: true,
            turboCharger: true,
          },
        },
        electricPowertrains: {
          where: { isDeleted: false },
          orderBy: { isDefault: 'desc' },
          take: 1,
          select: {
            numMotors: true,
            motorType: true,
            batteryCapacity: true,
            batteryChemistry: true,
            thermalManagementSystem: true,
            drivetrain: { select: { name: true } },
            powerPs: true,
            torqueNm: true,
            claimedRange: true,
            realWorldRange: true,
            topSpeedKmph: true,
            topSpeedTimeSec: true,
            acChargingOutput: true,
            acChargingTime: true,
            dcChargingOutput: true,
            dcFastChargingTime: true,
            batteryWarrantyKm: true,
            batteryWarrantyYears: true,
            motorWarrantyKm: true,
            motorWarrantyYears: true,
            standardWarrantyKm: true,
            standardWarrantyYears: true,
            emissionNormCompliance: true,
            motorPowerKw: true,
            chargingPort: true,
            chargingOptionsRaw: true,
            regenerativeBraking: true,
            regenerativeBrakingLevels: true,
          },
        },
        features: VARIANT_FEATURES_SELECT,
      },
    });

    if (!variant) throw ApiError.badRequest('Invalid variant for this car');

    const ice = variant.icePowertrains[0];
    const electric = variant.electricPowertrains[0];

    selectedVariant = {
      id: variant.id,
      variantName: variant.variantName,
      price: variant.price.toString(),
      seatingCapacity: variant.seatingCapacity,
      transmission: variant.transmission?.name ?? null,
      isElectric: Boolean(electric),
      ice: ice
        ? {
            fuelType: FUEL_TYPE_LABELS[ice.fuelType] ?? null,
            fuelTypeSubCategory: ice.fuelTypeSubCategory,
            fuelTankCapacity: ice.fuelTankCapacity?.toString() ?? null,
            cngTankCapacity: ice.cngTankCapacity?.toString() ?? null,
            kerbWeight: ice.kerbWeight,
            engineDisplacement: ice.engineDisplacement?.toString() ?? null,
            cubicCapacity: ice.cubicCapacity,
            cylinders: ice.cylinders,
            numGears: ice.numGears,
            isFourByFour: ice.isFourByFour,
            drivetrain: ice.drivetrain?.name ?? null,
            powerPs: ice.powerPs,
            powerMinRpm: ice.powerMinRpm,
            powerMaxRpm: ice.powerMaxRpm,
            torqueNm: ice.torqueNm,
            torqueMinRpm: ice.torqueMinRpm,
            torqueMaxRpm: ice.torqueMaxRpm,
            claimedFe: ice.claimedFe?.toString() ?? null,
            realWorldMileage: ice.realWorldMileage?.toString() ?? null,
            topSpeedKmph: ice.topSpeedKmph,
            topSpeedTimeSec: ice.topSpeedTimeSec?.toString() ?? null,
            emissionNormCompliance: ice.emissionNormCompliance,
            turboCharger: ice.turboCharger,
          }
        : null,
      electric: electric
        ? {
            numMotors: electric.numMotors,
            motorType: electric.motorType,
            batteryCapacity: electric.batteryCapacity?.toString() ?? null,
            batteryChemistry: electric.batteryChemistry,
            thermalManagementSystem: electric.thermalManagementSystem,
            drivetrain: electric.drivetrain?.name ?? null,
            powerPs: electric.powerPs,
            torqueNm: electric.torqueNm,
            claimedRange: electric.claimedRange,
            realWorldRange: electric.realWorldRange,
            topSpeedKmph: electric.topSpeedKmph,
            topSpeedTimeSec: electric.topSpeedTimeSec?.toString() ?? null,
            acChargingOutput: electric.acChargingOutput?.toString() ?? null,
            acChargingTime: electric.acChargingTime?.toString() ?? null,
            dcChargingOutput: electric.dcChargingOutput?.toString() ?? null,
            dcFastChargingTime: electric.dcFastChargingTime,
            batteryWarrantyKm: electric.batteryWarrantyKm,
            batteryWarrantyYears: electric.batteryWarrantyYears,
            motorWarrantyKm: electric.motorWarrantyKm,
            motorWarrantyYears: electric.motorWarrantyYears,
            standardWarrantyKm: electric.standardWarrantyKm,
            standardWarrantyYears: electric.standardWarrantyYears,
            emissionNormCompliance: electric.emissionNormCompliance,
            motorPowerKw: electric.motorPowerKw?.toString() ?? null,
            chargingPort: electric.chargingPort,
            chargingOptionsRaw: electric.chargingOptionsRaw,
            regenerativeBraking: electric.regenerativeBraking,
            regenerativeBrakingLevels: electric.regenerativeBrakingLevels,
          }
        : null,
      dimensions: {
        length: variant.length,
        width: variant.width,
        height: variant.height,
        wheelBase: variant.wheelBase,
        groundClearance: variant.groundClearance,
        bootSpace: variant.bootSpace,
        frontSuspension: variant.frontSuspension,
        rearSuspension: variant.rearSuspension,
        steeringType: variant.steeringType,
        frontBrakeType: variant.frontBrakeType,
        rearBrakeType: variant.rearBrakeType,
      },
      features: shapeVariantFeatures(variant.features),
    };
  }

  return {
    id: car.id,
    name: car.name,
    slug: car.slug,
    brand: car.brand,
    bodyType: car.bodyType,
    launchStatus: car.launchStatus,
    expectedLaunchDate: car.expectedLaunchDate?.toISOString() ?? null,
    priceMin: car.priceMin?.toString() ?? null,
    priceMax: car.priceMax?.toString() ?? null,
    ratingAvg: car.ratingAvg?.toString() ?? null,
    coverImageUrl: car.coverImageUrl,
    variantOptions: car.variants.map((v) => ({
      id: v.id,
      variantName: v.variantName,
      price: v.price.toString(),
      isTopSeller: v.isTopSeller,
    })),
    variantCount: car._count.variants,
    selectedVariant,
    images: car.images,
    colors: car.colors.map((c) => ({ ...c, additionalCost: c.additionalCost?.toString() ?? null })),
  };
}

// Full variant list for a model — backs the model-detail page's "View
// All" expansion (beyond getCarDetail's VARIANT_OPTIONS_PREVIEW_LIMIT)
// and the Write Review form's variant picker. Kept as its own lean
// endpoint rather than folded into getCarDetail so neither has to
// over-fetch for the other's need.
export async function getCarVariants(brandSlug: string, modelSlug: string): Promise<CarDetailVariantOption[]> {
  const car = await prisma.carModel.findFirst({
    where: { slug: modelSlug, brand: { slug: brandSlug, isActive: true } },
    select: {
      variants: {
        select: { id: true, variantName: true, price: true, isTopSeller: true },
        orderBy: [{ isTopSeller: 'desc' }, { price: 'asc' }],
      },
    },
  });

  if (!car) throw ApiError.notFound(`Car "${brandSlug}/${modelSlug}" not found`);

  return car.variants.map((v) => ({
    id: v.id,
    variantName: v.variantName,
    price: v.price.toString(),
    isTopSeller: v.isTopSeller,
  }));
}

export interface CarModelLookup {
  id: number;
  name: string;
  slug: string;
  priceMin: string | null;
  priceMax: string | null;
}

// Lightweight "models for this brand" picker (EMI calculator's Model
// dropdown, once a brand is chosen) — id/name/price only, not the full
// HOME_CAR_SELECT shape (no image/bodyType/rating needed for a picker).
export async function listModelsByBrand(brandId: number): Promise<CarModelLookup[]> {
  const models = await prisma.carModel.findMany({
    where: { brandId, launchStatus: 'available' },
    select: { id: true, name: true, slug: true, priceMin: true, priceMax: true },
    orderBy: { name: 'asc' },
  });

  return models.map((m) => ({
    ...m,
    priceMin: m.priceMin?.toString() ?? null,
    priceMax: m.priceMax?.toString() ?? null,
  }));
}

export interface CarVariantLookup {
  id: number;
  variantName: string;
  price: string;
  // Null for electric variants — the Mileage Calculator's fuel-type
  // filter uses these two fields to only show variants matching the
  // fuel type picked (EMI calculator ignores them).
  isElectric: boolean;
  fuelType: string | null;
}

// Lightweight "variants for this model" picker (EMI + Mileage
// calculators' Variant dropdown) — every variant's own price, cheapest
// first.
export async function listVariantsByModel(modelId: number): Promise<CarVariantLookup[]> {
  const variants = await prisma.carVariant.findMany({
    where: { modelId },
    select: {
      id: true,
      variantName: true,
      price: true,
      icePowertrains: { where: { isDeleted: false }, take: 1, select: { fuelType: true } },
      electricPowertrains: { where: { isDeleted: false }, take: 1, select: { id: true } },
    },
    orderBy: { price: 'asc' },
  });

  return variants.map((v) => {
    const isElectric = v.electricPowertrains.length > 0;
    const fuelType = !isElectric && v.icePowertrains[0] ? (FUEL_TYPE_LABELS[v.icePowertrains[0].fuelType] ?? null) : null;
    return { id: v.id, variantName: v.variantName, price: v.price.toString(), isElectric, fuelType };
  });
}

export interface CarImagesResult {
  name: string;
  brand: { name: string; slug: string };
  images: CarDetailImage[];
  colors: CarDetailColor[];
}

// "/tata-motors-cars/nexon/photos" — a dedicated lean endpoint (name +
// images + colors) so the photos page doesn't have to pull the full
// detail payload (variants/specs/features) just to render a gallery.
export async function getCarImages(brandSlug: string, modelSlug: string): Promise<CarImagesResult> {
  const car = await prisma.carModel.findFirst({
    where: { slug: modelSlug, brand: { slug: brandSlug, isActive: true } },
    select: {
      name: true,
      brand: { select: { name: true, slug: true } },
      images: {
        select: { id: true, imageUrl: true, isPrimary: true, angle: true, colorId: true },
        orderBy: { isPrimary: 'desc' },
      },
      colors: {
        select: {
          id: true,
          colorName: true,
          imageUrl: true,
          additionalCost: true,
          shades: { select: { colorHex: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  if (!car) throw ApiError.notFound(`Car "${brandSlug}/${modelSlug}" not found`);
  return { ...car, colors: car.colors.map((c) => ({ ...c, additionalCost: c.additionalCost?.toString() ?? null })) };
}

export interface CarFaqResult {
  id: number;
  question: string;
  answer: string;
}

// "/tata-motors-cars/nexon" FAQs section — question/answer only, no need
// for displayOrder/viewCount/isActive in the response since the query
// already filters/sorts by them.
export async function getCarFaqs(brandSlug: string, modelSlug: string): Promise<CarFaqResult[]> {
  return prisma.carFaq.findMany({
    where: { isActive: true, model: { slug: modelSlug, brand: { slug: brandSlug, isActive: true } } },
    select: { id: true, question: true, answer: true },
    orderBy: { displayOrder: 'asc' },
  });
}

export interface CarArticleResult {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  readTimeMinutes: number | null;
  publishedAt: string | null;
  category: { id: number; name: string; slug: string };
  author: { id: number; name: string };
}

// "/tata-motors-cars/nexon" News section — articles tagged to this exact
// model via ArticleCarModel, not just the brand (see modules/public/brands
// for the brand-level equivalent). Same summary shape as
// PublicHomeArticleRecord (modules/public/home/article) — duplicated
// locally rather than imported since it's a small, module-local select.
export async function getCarArticles(brandSlug: string, modelSlug: string, limit = 6): Promise<CarArticleResult[]> {
  const articles = await prisma.article.findMany({
    where: {
      status: 'published',
      isActive: true,
      category: { isActive: true },
      articleCarModels: { some: { model: { slug: modelSlug, brand: { slug: brandSlug, isActive: true } } } },
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

  return articles.map((article) => ({ ...article, publishedAt: article.publishedAt?.toISOString() ?? null }));
}
