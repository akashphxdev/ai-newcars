// src/modules/newCars/colorImage/colorImage.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import type { ListModelsWithColorsOrImagesQueryParsed } from './colorImage.validation';
import type { ModelWithColorsOrImagesRecord } from './colorImage.types';

// Listing for the Colors & Images admin page — only models that already
// have at least one color or image (relation-filter via `some: {}`),
// not every car model in the catalog. A brand-new model only shows up
// here once its first color/image has been added via the "Add to new
// model" flow.
export async function listModelsWithColorsOrImages(
  query: ListModelsWithColorsOrImagesQueryParsed,
): Promise<{ items: ModelWithColorsOrImagesRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const { page, limit, search } = query;

  const where: Prisma.CarModelWhereInput = {
    AND: [
      { OR: [{ colors: { some: {} } }, { images: { some: {} } }] },
      ...(search
        ? [
            {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { brand: { name: { contains: search, mode: 'insensitive' as const } } },
              ],
            },
          ]
        : []),
    ],
  };

  const [items, total] = await Promise.all([
    prisma.carModel.findMany({
      where,
      select: {
        id: true,
        name: true,
        brand: { select: { id: true, name: true } },
        _count: { select: { colors: true, images: true } },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carModel.count({ where }),
  ]);

  return {
    items: items.map((m) => ({
      id: m.id,
      name: m.name,
      brand: m.brand,
      colorsCount: m._count.colors,
      imagesCount: m._count.images,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
