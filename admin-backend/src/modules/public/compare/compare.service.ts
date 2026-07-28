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
  CompareVariantPowertrainOption,
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
  brand: { select: { id: true, name: true, slug: true } },
  bodyType: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.CarModelSelect;

async function getCarWithVariant(slug: string, variantId?: number, powertrainId?: number): Promise<CompareCarResult> {
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
    return { ...base, isElectric: false, selectedVariant: null, selectedPowertrain: null, powertrainOptions: [], specs: null };
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
        select: {
          id: true,
          isDefault: true,
          fuelType: true,
          fuelTypeSubCategory: true,
          cubicCapacity: true,
          cylinders: true,
          fuelTankCapacity: true,
          cngTankCapacity: true,
          kerbWeight: true,
          transmissionType: { select: { name: true } },
          numGears: true,
          isFourByFour: true,
          drivetrain: { select: { name: true } },
          realWorldMileage: true,
          claimedFe: true,
          cityMileage: true,
          highwayMileage: true,
          powerPs: true,
          torqueNm: true,
          topSpeedKmph: true,
        },
      },
      electricPowertrains: {
        where: { isDeleted: false },
        orderBy: { isDefault: 'desc' },
        select: {
          id: true,
          isDefault: true,
          motorType: true,
          batteryCapacity: true,
          batteryChemistry: true,
          drivetrain: { select: { name: true } },
          claimedRange: true,
          realWorldRange: true,
          dcFastChargingTime: true,
          acChargingTime: true,
          powertrainBootspace: true,
          batteryWarrantyYears: true,
          powerPs: true,
          torqueNm: true,
          topSpeedKmph: true,
        },
      },
      features: {
        take: 1,
        select: {
          airbagsCount: true,
          absWithEbd: true,
          esc: true,
          hillAssist: true,
          rearParkingCamera: true,
          frontParkingSensors: true,
          tpms: true,
          isofixMounts: true,
          ncapRating: true,
          sunroof: true,
          keylessEntry: true,
          pushButtonStart: true,
          cruiseControl: true,
          climateControl: true,
          rearAcVents: true,
          autoDimmingMirror: true,
          powerWindows: true,
          upholsteryType: true,
          adjustableSeats: true,
          ventilatedSeats: true,
          rearArmrest: true,
          ledHeadlamps: true,
          ledDrls: true,
          alloyWheels: true,
          roofRails: true,
          fogLamps: true,
          touchscreenSizeInch: true,
          androidAuto: true,
          appleCarplay: true,
          connectedCarTech: true,
          numberOfSpeakers: true,
          wirelessCharging: true,
        },
      },
    },
  });

  if (!variant) throw ApiError.badRequest('Invalid variant for this car');

  // A variant can have more than one powertrain row (e.g. same trim in
  // Petrol and CNG) — pick the one explicitly requested, else whichever
  // is flagged isDefault, else just the first.
  const pickPowertrain = <T extends { id: number; isDefault: boolean }>(rows: T[]): T | undefined =>
    (powertrainId ? rows.find((r) => r.id === powertrainId) : undefined) ?? rows.find((r) => r.isDefault) ?? rows[0];

  const ice = pickPowertrain(variant.icePowertrains);
  const electric = ice ? undefined : pickPowertrain(variant.electricPowertrains);
  const feat = variant.features[0];

  const selectedPowertrain: CompareVariantPowertrainOption | null = ice
    ? { id: ice.id, label: [FUEL_TYPE_LABELS[ice.fuelType], ice.fuelTypeSubCategory].filter(Boolean).join(' '), isDefault: ice.isDefault }
    : electric
      ? { id: electric.id, label: electric.motorType ?? 'Electric', isDefault: electric.isDefault }
      : null;

  const powertrainOptions: CompareVariantPowertrainOption[] =
    variant.icePowertrains.length > 0
      ? variant.icePowertrains.map((p) => ({
          id: p.id,
          label: [FUEL_TYPE_LABELS[p.fuelType], p.fuelTypeSubCategory].filter(Boolean).join(' '),
          isDefault: p.isDefault,
        }))
      : variant.electricPowertrains.map((p) => ({ id: p.id, label: p.motorType ?? 'Electric', isDefault: p.isDefault }));

  const specs: CompareCarSpecs = {
    seatingCapacity: variant.seatingCapacity,
    transmission: variant.transmission?.name ?? null,
    drivetrain: ice?.drivetrain?.name ?? electric?.drivetrain?.name ?? null,
    fuelType: ice ? FUEL_TYPE_LABELS[ice.fuelType] ?? null : null,
    fuelTypeSubCategory: ice?.fuelTypeSubCategory ?? null,
    engineDisplacementCc: ice?.cubicCapacity ?? null,
    cylinders: ice?.cylinders ?? null,
    gearboxType: ice?.transmissionType?.name ?? null,
    numGears: ice?.numGears ?? null,
    isFourByFour: ice?.isFourByFour ?? false,
    fuelTankCapacity: ice?.fuelTankCapacity?.toString() ?? null,
    cngTankCapacity: ice?.cngTankCapacity?.toString() ?? null,
    kerbWeight: ice?.kerbWeight ?? null,
    mileage: (ice?.realWorldMileage ?? ice?.claimedFe)?.toString() ?? null,
    cityMileage: ice?.cityMileage?.toString() ?? null,
    highwayMileage: ice?.highwayMileage?.toString() ?? null,
    batteryCapacity: electric?.batteryCapacity?.toString() ?? null,
    batteryChemistry: electric?.batteryChemistry ?? null,
    claimedRange: electric?.claimedRange ?? null,
    realWorldRange: electric?.realWorldRange ?? null,
    range: electric ? electric.realWorldRange ?? electric.claimedRange : null,
    chargeTime: electric?.dcFastChargingTime ?? null,
    acChargingTime: electric?.acChargingTime?.toString() ?? null,
    powertrainBootspace: electric?.powertrainBootspace ?? null,
    batteryWarrantyYears: electric?.batteryWarrantyYears ?? null,
    powerPs: ice?.powerPs ?? electric?.powerPs ?? null,
    torqueNm: ice?.torqueNm ?? electric?.torqueNm ?? null,
    topSpeedKmph: ice?.topSpeedKmph ?? electric?.topSpeedKmph ?? null,
    features: {
      airbagsCount: feat?.airbagsCount ?? null,
      absWithEbd: feat?.absWithEbd ?? false,
      esc: feat?.esc ?? false,
      hillAssist: feat?.hillAssist ?? false,
      rearParkingCamera: feat?.rearParkingCamera ?? false,
      frontParkingSensors: feat?.frontParkingSensors ?? false,
      tpms: feat?.tpms ?? false,
      isofixMounts: feat?.isofixMounts ?? false,
      ncapRating: feat?.ncapRating?.toString() ?? null,
      sunroof: feat?.sunroof ?? false,
      keylessEntry: feat?.keylessEntry ?? false,
      pushButtonStart: feat?.pushButtonStart ?? false,
      cruiseControl: feat?.cruiseControl ?? false,
      climateControl: feat?.climateControl ?? false,
      rearAcVents: feat?.rearAcVents ?? false,
      autoDimmingMirror: feat?.autoDimmingMirror ?? false,
      powerWindows: feat?.powerWindows ?? false,
      upholsteryType: feat?.upholsteryType ?? null,
      adjustableSeats: feat?.adjustableSeats ?? false,
      ventilatedSeats: feat?.ventilatedSeats ?? false,
      rearArmrest: feat?.rearArmrest ?? false,
      ledHeadlamps: feat?.ledHeadlamps ?? false,
      ledDrls: feat?.ledDrls ?? false,
      alloyWheels: feat?.alloyWheels ?? false,
      roofRails: feat?.roofRails ?? false,
      fogLamps: feat?.fogLamps ?? false,
      touchscreenSizeInch: feat?.touchscreenSizeInch?.toString() ?? null,
      androidAuto: feat?.androidAuto ?? false,
      appleCarplay: feat?.appleCarplay ?? false,
      connectedCarTech: feat?.connectedCarTech ?? false,
      numberOfSpeakers: feat?.numberOfSpeakers ?? null,
      wirelessCharging: feat?.wirelessCharging ?? false,
    },
  };

  return {
    ...base,
    isElectric: Boolean(electric),
    selectedVariant: { id: variant.id, variantName: variant.variantName, price: variant.price.toString() },
    selectedPowertrain,
    powertrainOptions,
    specs,
  };
}

// variants/powertrains are same-length comma lists aligned with `cars` by
// position — "" for a given index means "use that car's default".
function parseIds(raw: string | undefined, count: number): (number | undefined)[] {
  const parts = raw ? raw.split(',') : [];
  return Array.from({ length: count }, (_, i) => {
    const n = Number(parts[i]);
    return parts[i] && Number.isFinite(n) ? n : undefined;
  });
}

export async function getCompareData(query: CompareQueryParsed): Promise<CompareResult> {
  const variantIds = parseIds(query.variants, query.cars.length);
  const powertrainIds = parseIds(query.powertrains, query.cars.length);
  const cars = await Promise.all(query.cars.map((slug, i) => getCarWithVariant(slug, variantIds[i], powertrainIds[i])));
  return { cars };
}

// "Pick variant" step's follow-up — every powertrain row under one
// variant (a variant can have more than one: same trim in Petrol/CNG,
// or MT/AMT), for the compare picker's 4th cascading select.
export async function listVariantPowertrainOptions(slug: string, variantId: number): Promise<CompareVariantPowertrainOption[]> {
  const variant = await prisma.carVariant.findFirst({
    where: { id: variantId, model: { slug } },
    select: {
      icePowertrains: {
        where: { isDeleted: false },
        orderBy: { isDefault: 'desc' },
        select: { id: true, isDefault: true, fuelType: true, fuelTypeSubCategory: true },
      },
      electricPowertrains: {
        where: { isDeleted: false },
        orderBy: { isDefault: 'desc' },
        select: { id: true, isDefault: true, motorType: true },
      },
    },
  });
  if (!variant) throw ApiError.notFound(`Variant ${variantId} not found for car "${slug}"`);

  if (variant.icePowertrains.length > 0) {
    return variant.icePowertrains.map((p) => ({
      id: p.id,
      label: [FUEL_TYPE_LABELS[p.fuelType], p.fuelTypeSubCategory].filter(Boolean).join(' '),
      isDefault: p.isDefault,
    }));
  }
  return variant.electricPowertrains.map((p) => ({ id: p.id, label: p.motorType ?? 'Electric', isDefault: p.isDefault }));
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

  if (query.brandSlug) {
    where.brand = { slug: query.brandSlug };
  }

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

// Brand-page "vs other brands" section — unlike getRandomComparisonPairs
// (which pairs candidates from ONE filtered pool, so a brandSlug filter
// there produces same-brand pairs), this deliberately draws carA from
// the given brand and carB from every OTHER brand, so every pair is a
// genuine cross-brand match-up.
export async function getBrandCrossBrandPairs(
  brandSlug: string,
  count: number,
): Promise<RandomComparisonPair[]> {
  const brand = await prisma.brand.findFirst({ where: { slug: brandSlug, isActive: true }, select: { id: true } });
  if (!brand) return [];

  const [brandCars, otherCars] = await Promise.all([
    prisma.carModel.findMany({ where: { brandId: brand.id, launchStatus: 'available' }, select: { id: true }, orderBy: { id: 'asc' } }),
    prisma.carModel.findMany({ where: { brandId: { not: brand.id }, launchStatus: 'available' }, select: { id: true }, orderBy: { id: 'asc' } }),
  ]);

  const shuffledBrand = seededShuffle(brandCars.map((c) => c.id), daySeed());
  const shuffledOther = seededShuffle(otherCars.map((c) => c.id), daySeed() + 1);
  const n = Math.min(count, shuffledBrand.length, shuffledOther.length);
  const idPairs: [number, number][] = Array.from({ length: n }, (_, i) => [shuffledBrand[i], shuffledOther[i]]);

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

  return idPairs.map(([a, b]) => ({ carA: shapeCar(a), carB: shapeCar(b) }));
}

// Model page's "Comparison" section — this exact model (carA, fixed) vs
// `count` different random other models (carB), so it's always this car
// being compared, never two other cars paired with each other.
export async function getModelCrossPairs(brandSlug: string, modelSlug: string, count: number): Promise<RandomComparisonPair[]> {
  const model = await prisma.carModel.findFirst({
    where: { slug: modelSlug, brand: { slug: brandSlug, isActive: true } },
    select: { id: true },
  });
  if (!model) return [];

  const others = await prisma.carModel.findMany({
    where: { id: { not: model.id }, launchStatus: 'available' },
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  const shuffledOthers = seededShuffle(others.map((c) => c.id), daySeed());
  const otherIds = shuffledOthers.slice(0, count);

  const cars = await prisma.carModel.findMany({
    where: { id: { in: [model.id, ...otherIds] } },
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

  return otherIds.map((otherId) => ({ carA: shapeCar(model.id), carB: shapeCar(otherId) }));
}
