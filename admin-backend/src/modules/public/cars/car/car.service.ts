// src/modules/public/cars/car/car.service.ts

import { prisma } from '@/prisma/client';
import { HOME_CAR_SELECT, shapeHomeCarModel, buildHomeCarWhereAndOrderBy } from '@/modules/public/home/car/car.service';
import type { PublicHomeCarRecord } from '@/modules/public/home/car/car.types';
import type { CarListQueryParsed } from './car.validation';

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
