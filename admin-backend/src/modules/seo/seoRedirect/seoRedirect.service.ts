// src/modules/seo/seoRedirect/seoRedirect.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { SeoRedirectListQueryParsed, CreateSeoRedirectParsed, UpdateSeoRedirectParsed } from './seoRedirect.validation';
import type { SeoRedirectRecord } from './seoRedirect.types';

const SEO_REDIRECT_SELECT = {
  id: true,
  oldPath: true,
  newPath: true,
  redirectType: true,
  isActive: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  updatedAt: true,
} as const;

// oldPath is the key a redirect gets looked up by on the live site — two
// rows for the same path would make "where does this URL go" ambiguous.
// The DB's own @unique constraint would also catch this, but checking
// first gives a friendlier 409 instead of a raw Prisma P2002.
async function assertOldPathAvailable(oldPath: string, excludeId?: number) {
  const conflict = await prisma.seoRedirect.findFirst({
    where: { oldPath, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(`A redirect for "${oldPath}" already exists`);
  }
}

export async function listSeoRedirects(query: SeoRedirectListQueryParsed) {
  const { page, limit, search, isActive, sortBy, sortOrder } = query;

  const where: Prisma.SeoRedirectWhereInput = {
    ...(search
      ? {
          OR: [
            { oldPath: { contains: search, mode: 'insensitive' } },
            { newPath: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.seoRedirect.findMany({
      where,
      select: SEO_REDIRECT_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.seoRedirect.count({ where }),
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

export async function getSeoRedirectById(id: number): Promise<SeoRedirectRecord> {
  const redirect = await prisma.seoRedirect.findUnique({ where: { id }, select: SEO_REDIRECT_SELECT });
  if (!redirect) {
    throw ApiError.notFound('Redirect not found');
  }
  return redirect;
}

export async function createSeoRedirect(
  input: CreateSeoRedirectParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<SeoRedirectRecord> {
  await assertOldPathAvailable(input.oldPath);

  const redirect = await prisma.seoRedirect.create({
    data: {
      oldPath: input.oldPath,
      newPath: input.newPath,
      redirectType: input.redirectType,
      isActive: input.isActive,
      createdBy: actorId,
      updatedBy: actorId,
    },
    select: SEO_REDIRECT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created redirect "${redirect.oldPath}" -> "${redirect.newPath}" (id ${redirect.id})`,
    ipAddress,
  });

  return redirect;
}

export async function updateSeoRedirect(
  id: number,
  input: UpdateSeoRedirectParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<SeoRedirectRecord> {
  const existing = await getSeoRedirectById(id);

  if (input.oldPath !== existing.oldPath) {
    await assertOldPathAvailable(input.oldPath, id);
  }

  const redirect = await prisma.seoRedirect.update({
    where: { id },
    data: {
      oldPath: input.oldPath,
      newPath: input.newPath,
      redirectType: input.redirectType,
      isActive: input.isActive,
      updatedBy: actorId,
    },
    select: SEO_REDIRECT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated redirect (id ${redirect.id})`,
    ipAddress,
  });

  return redirect;
}

export async function updateSeoRedirectStatus(
  id: number,
  isActive: boolean,
  actorId: number,
  ipAddress?: string | null,
): Promise<SeoRedirectRecord> {
  await getSeoRedirectById(id);

  const redirect = await prisma.seoRedirect.update({
    where: { id },
    data: { isActive, updatedBy: actorId },
    select: SEO_REDIRECT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} redirect (id ${id})`,
    ipAddress,
  });

  return redirect;
}

export async function deleteSeoRedirect(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await getSeoRedirectById(id);

  await prisma.seoRedirect.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted redirect "${existing.oldPath}" -> "${existing.newPath}" (id ${existing.id})`,
    ipAddress,
  });

  return { message: 'Redirect deleted successfully' };
}
