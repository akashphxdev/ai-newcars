// src/modules/public/home/car/car.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import type { HomeCarListQueryParsed } from './car.validation';
import type { PublicHomeCarRecord } from './car.types';

// Only one variant per car is needed for a homepage card — top-seller
// first, else cheapest — so it's picked in the query itself (take: 1)
// rather than fetching every variant and filtering in JS.
const HOME_CAR_SELECT = {
  id: true,
  name: true,
  slug: true,
  launchStatus: true,
  expectedLaunchDate: true,
  priceMin: true,
  priceMax: true,
  ratingAvg: true,
  coverImageUrl: true,
  brand: { select: { id: true, name: true } },
  bodyType: { select: { id: true, name: true } },
  variants: {
    orderBy: [{ isTopSeller: 'desc' }, { price: 'asc' }],
    take: 1,
    select: {
      seatingCapacity: true,
      icePowertrains: {
        where: { isDeleted: false },
        orderBy: { isDefault: 'desc' },
        take: 1,
        select: {
          cubicCapacity: true,
          realWorldMileage: true,
          claimedFe: true,
          powerPs: true,
          torqueNm: true,
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
          topSpeedKmph: true,
        },
      },
    },
  },
} satisfies Prisma.CarModelSelect;

type RawHomeCarModel = Prisma.CarModelGetPayload<{ select: typeof HOME_CAR_SELECT }>;

function shapeHomeCarModel(car: RawHomeCarModel): PublicHomeCarRecord {
  const variant = car.variants[0];
  const ice = variant?.icePowertrains[0];
  const electric = variant?.electricPowertrains[0];

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
    isElectric: Boolean(electric),
    specs: variant
      ? {
          seatingCapacity: variant.seatingCapacity,
          engineCc: ice?.cubicCapacity ?? null,
          mileage: (ice?.realWorldMileage ?? ice?.claimedFe)?.toString() ?? null,
          powerPs: ice?.powerPs ?? null,
          torqueNm: ice?.torqueNm ?? null,
          batteryCapacity: electric?.batteryCapacity?.toString() ?? null,
          range: electric?.realWorldRange ?? electric?.claimedRange ?? null,
          chargeTime: electric?.dcFastChargingTime ?? null,
          topSpeedKmph: electric?.topSpeedKmph ?? null,
        }
      : null,
  };
}

// "popular" has no dedicated ranking field on CarModel yet — ratingAvg is
// used as a proxy (nulls sorted last so unrated models don't crowd out
// rated ones). Revisit once real search/view analytics feed ranking.
export async function listHomeCars(query: HomeCarListQueryParsed): Promise<PublicHomeCarRecord[]> {
  const { type, limit } = query;

  let where: Prisma.CarModelWhereInput;
  let orderBy: Prisma.CarModelOrderByWithRelationInput | Prisma.CarModelOrderByWithRelationInput[];

  switch (type) {
    case 'upcoming':
      where = { launchStatus: 'upcoming' };
      orderBy = { expectedLaunchDate: 'asc' };
      break;
    case 'electric':
      where = { launchStatus: 'available', variants: { some: { electricPowertrains: { some: {} } } } };
      orderBy = { createdAt: 'desc' };
      break;
    case 'popular':
      where = { launchStatus: 'available' };
      orderBy = [{ ratingAvg: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }];
      break;
    case 'latest':
    default:
      where = { launchStatus: 'available' };
      orderBy = { createdAt: 'desc' };
      break;
  }

  const cars = await prisma.carModel.findMany({
    where,
    select: HOME_CAR_SELECT,
    orderBy,
    take: limit,
  });

  return cars.map(shapeHomeCarModel);
}
