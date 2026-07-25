// src/modules/public/compare/compare.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import type { CompareQueryParsed, RandomPairsQueryParsed, FuelFilter } from './compare.validation';
import type {
  CompareCarResult,
  CompareResult,
  CompareCarSpecs,
  CompareVariantOption,
  RandomComparisonPair,
  RandomPairCar,
  CarOption,
} from './compare.types';

// Numeric codes match powertrainIce.validation.ts's FUEL_TYPE_CODES
// (1=Petrol, 2=Diesel, 3=CNG, 4=LPG, 5=Hybrid) — duplicated here rather
// than imported since that file lives under modules/newCars (admin-only
// concern) and this is the one place the public API needs the label,
// not the admin CRUD validation rules.
const FUEL_TYPE_LABELS: Record<number, string> = {
  1: 'Petrol',
  2: 'Diesel',
  3: 'CNG',
  4: 'LPG',
  5: 'Hybrid',
};

const FUEL_FILTER_CODES: Partial<Record<FuelFilter, number>> = {
  petrol: 1,
  diesel: 2,
  cng: 3,
};

const CAR_BASE_SELECT = {
  id: true,
  name: true,
  slug: true,
  priceMin: true,
  priceMax: true,
  ratingAvg: true,
  coverImageUrl: true,
  brand: { select: { id: true, name: true } },
  bodyType: { select: { id: true, name: true } },
} satisfies Prisma.CarModelSelect;

async function getCarWithVariant(slug: string, variantId?: number): Promise<CompareCarResult> {
  const car = await prisma.carModel.findUnique({
    where: { slug },
    select: {
      ...CAR_BASE_SELECT,
      variants: {
        select: { id: true, variantName: true, price: true },
        orderBy: [{ isTopSeller: 'desc' }, { price: 'asc' }],
      },
    },
  });

  if (!car) throw ApiError.notFound(`Car "${slug}" not found`);

  const variantOptions: CompareVariantOption[] = car.variants.map((v) => ({
    id: v.id,
    variantName: v.variantName,
    price: v.price.toString(),
  }));

  const chosenVariantId = variantId ?? car.variants[0]?.id;
  const base = {
    id: car.id,
    name: car.name,
    slug: car.slug,
    brand: car.brand,
    bodyType: car.bodyType,
    coverImageUrl: car.coverImageUrl,
    priceMin: car.priceMin?.toString() ?? null,
    priceMax: car.priceMax?.toString() ?? null,
    ratingAvg: car.ratingAvg?.toString() ?? null,
    variantOptions,
  };

  if (!chosenVariantId) {
    return { ...base, isElectric: false, selectedVariant: null, specs: null };
  }

  const variant = await prisma.carVariant.findFirst({
    where: { id: chosenVariantId, modelId: car.id },
    select: {
      id: true,
      variantName: true,
      price: true,
      seatingCapacity: true,
      transmission: { select: { name: true } },
      icePowertrains: {
        where: { isDeleted: false },
        orderBy: { isDefault: 'desc' },
        take: 1,
        select: {
          fuelType: true,
          cubicCapacity: true,
          realWorldMileage: true,
          claimedFe: true,
          powerPs: true,
          torqueNm: true,
          topSpeedKmph: true,
        },
      },
      electricPowertrains: {
        where: { isDeleted: false },
        orderBy: { isDefault: 'desc' },
        take: 1,
        select: {
          batteryCapacity: true,
          claimedRange: true,
          realWorldRange: true,
          dcFastChargingTime: true,
          powerPs: true,
          torqueNm: true,
          topSpeedKmph: true,
        },
      },
      features: {
        take: 1,
        select: {
          airbagsCount: true,
          ncapRating: true,
          sunroof: true,
          rearParkingCamera: true,
          cruiseControl: true,
          climateControl: true,
          keylessEntry: true,
          pushButtonStart: true,
          androidAuto: true,
          appleCarplay: true,
          ledHeadlamps: true,
          alloyWheels: true,
          wirelessCharging: true,
        },
      },
    },
  });

  if (!variant) throw ApiError.badRequest('Invalid variant for this car');

  const ice = variant.icePowertrains[0];
  const electric = variant.electricPowertrains[0];
  const feat = variant.features[0];

  const specs: CompareCarSpecs = {
    seatingCapacity: variant.seatingCapacity,
    transmission: variant.transmission?.name ?? null,
    fuelType: ice ? FUEL_TYPE_LABELS[ice.fuelType] ?? null : null,
    engineDisplacementCc: ice?.cubicCapacity ?? null,
    mileage: (ice?.realWorldMileage ?? ice?.claimedFe)?.toString() ?? null,
    batteryCapacity: electric?.batteryCapacity?.toString() ?? null,
    range: electric ? electric.realWorldRange ?? electric.claimedRange : null,
    chargeTime: electric?.dcFastChargingTime ?? null,
    powerPs: ice?.powerPs ?? electric?.powerPs ?? null,
    torqueNm: ice?.torqueNm ?? electric?.torqueNm ?? null,
    topSpeedKmph: ice?.topSpeedKmph ?? electric?.topSpeedKmph ?? null,
    features: {
      airbagsCount: feat?.airbagsCount ?? null,
      ncapRating: feat?.ncapRating?.toString() ?? null,
      sunroof: feat?.sunroof ?? false,
      rearParkingCamera: feat?.rearParkingCamera ?? false,
      cruiseControl: feat?.cruiseControl ?? false,
      climateControl: feat?.climateControl ?? false,
      keylessEntry: feat?.keylessEntry ?? false,
      pushButtonStart: feat?.pushButtonStart ?? false,
      androidAuto: feat?.androidAuto ?? false,
      appleCarplay: feat?.appleCarplay ?? false,
      ledHeadlamps: feat?.ledHeadlamps ?? false,
      alloyWheels: feat?.alloyWheels ?? false,
      wirelessCharging: feat?.wirelessCharging ?? false,
    },
  };

  return {
    ...base,
    isElectric: Boolean(electric),
    selectedVariant: { id: variant.id, variantName: variant.variantName, price: variant.price.toString() },
    specs,
  };
}

// variants is a same-length comma list aligned with `cars` by position —
// "" for a given index means "use that car's default variant".
function parseVariantIds(raw: string | undefined, count: number): (number | undefined)[] {
  const parts = raw ? raw.split(',') : [];
  return Array.from({ length: count }, (_, i) => {
    const n = Number(parts[i]);
    return parts[i] && Number.isFinite(n) ? n : undefined;
  });
}

export async function getCompareData(query: CompareQueryParsed): Promise<CompareResult> {
  const variantIds = parseVariantIds(query.variants, query.cars.length);
  const cars = await Promise.all(query.cars.map((slug, i) => getCarWithVariant(slug, variantIds[i])));
  return { cars };
}

export async function listCarOptions(): Promise<CarOption[]> {
  const cars = await prisma.carModel.findMany({
    where: { launchStatus: 'available' },
    select: {
      id: true,
      name: true,
      slug: true,
      coverImageUrl: true,
      priceMin: true,
      brand: { select: { id: true, name: true } },
    },
    orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
  });

  return cars.map((c) => ({ ...c, priceMin: c.priceMin?.toString() ?? null }));
}

export async function listCarVariantOptions(slug: string): Promise<CompareVariantOption[]> {
  const car = await prisma.carModel.findUnique({
    where: { slug },
    select: {
      variants: {
        select: { id: true, variantName: true, price: true },
        orderBy: [{ isTopSeller: 'desc' }, { price: 'asc' }],
      },
    },
  });

  if (!car) throw ApiError.notFound(`Car "${slug}" not found`);

  return car.variants.map((v) => ({ id: v.id, variantName: v.variantName, price: v.price.toString() }));
}

function buildRandomPairsWhere(query: RandomPairsQueryParsed): Prisma.CarModelWhereInput {
  const where: Prisma.CarModelWhereInput = { launchStatus: 'available' };

  if (query.bodyTypeSlug) {
    where.bodyType = { slug: query.bodyTypeSlug };
  }

  if (query.fuelType === 'electric') {
    where.variants = { some: { electricPowertrains: { some: {} } } };
  } else if (query.fuelType) {
    const code = FUEL_FILTER_CODES[query.fuelType];
    where.variants = { some: { icePowertrains: { some: { fuelType: code } } } };
  }

  if (query.minPrice != null || query.maxPrice != null) {
    where.priceMin = {
      ...(query.minPrice != null ? { gte: query.minPrice } : {}),
      ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
    };
  }

  return where;
}

// Deterministic per calendar day — same "random" pairing/order all day
// (so paging through the list doesn't repeat or skip pairs), reshuffles
// the next day. A linear-congruential PRNG seeded this way is enough for
// "keep the list feeling fresh"; no need for crypto-grade randomness here.
function daySeed(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0).getTime();
  return now.getFullYear() * 1000 + Math.floor((now.getTime() - startOfYear) / 86_400_000);
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function getRandomComparisonPairs(query: RandomPairsQueryParsed): Promise<{
  items: RandomComparisonPair[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const where = buildRandomPairsWhere(query);

  const candidates = await prisma.carModel.findMany({ where, select: { id: true }, orderBy: { id: 'asc' } });
  const shuffledIds = seededShuffle(candidates.map((c) => c.id), daySeed());
  const totalPairs = Math.floor(shuffledIds.length / 2);

  const { page, count } = query;
  const start = (page - 1) * count;
  const pageIds = shuffledIds.slice(start, start + count * 2);

  const idPairs: [number, number][] = [];
  for (let i = 0; i < pageIds.length - 1; i += 2) {
    idPairs.push([pageIds[i], pageIds[i + 1]]);
  }

  const cars = await prisma.carModel.findMany({
    where: { id: { in: idPairs.flat() } },
    select: {
      id: true,
      name: true,
      slug: true,
      coverImageUrl: true,
      priceMin: true,
      brand: { select: { id: true, name: true } },
    },
  });
  const carById = new Map(cars.map((c) => [c.id, c]));

  const shapeCar = (id: number): RandomPairCar => {
    const c = carById.get(id)!;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      brand: c.brand,
      coverImageUrl: c.coverImageUrl,
      priceMin: c.priceMin?.toString() ?? null,
    };
  };

  return {
    items: idPairs.map(([a, b]) => ({ carA: shapeCar(a), carB: shapeCar(b) })),
    pagination: { page, limit: count, total: totalPairs, totalPages: Math.ceil(totalPairs / count) || 1 },
  };
}
