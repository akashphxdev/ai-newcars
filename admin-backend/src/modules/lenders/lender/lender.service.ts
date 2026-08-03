// src/modules/lenders/lender/lender.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type { LenderListQueryParsed, LenderOptionsQueryParsed, CreateLenderParsed, UpdateLenderParsed } from './lender.validation';
import type { LenderUploadLogoResult } from './lender.types';

const LENDER_SELECT = {
  id: true,
  name: true,
  logoUrl: true,
  minInterestRate: true,
  maxInterestRate: true,
  maxLoanAmount: true,
  maxTenureYears: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdByAdmin: { select: { id: true, name: true } },
  updatedByAdmin: { select: { id: true, name: true } },
} as const;

export async function listLenders(query: LenderListQueryParsed) {
  const { page, limit, search, isActive, sortBy, sortOrder } = query;

  const where: Prisma.LenderWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.lender.findMany({
      where,
      select: LENDER_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lender.count({ where }),
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

// Dropdown-only source — every matching lender in one shot, no
// pagination. Used by the Loan Lead form's "Preferred Lender" <select>.
export async function listLenderOptions(query: LenderOptionsQueryParsed) {
  const { isActive } = query;

  const where: Prisma.LenderWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
  };

  return prisma.lender.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function getLenderById(id: number) {
  const lender = await prisma.lender.findUnique({
    where: { id },
    select: LENDER_SELECT,
  });

  if (!lender) {
    throw ApiError.notFound('Lender not found');
  }

  return lender;
}

export async function createLender(
  input: CreateLenderParsed,
  actorId: number,
  logoFilename: string | undefined,
  ipAddress?: string | null,
) {
  const lender = await prisma.lender.create({
    data: {
      name: input.name,
      minInterestRate: input.minInterestRate,
      maxInterestRate: input.maxInterestRate,
      maxLoanAmount: input.maxLoanAmount,
      maxTenureYears: input.maxTenureYears,
      isActive: input.isActive ?? true,
      // Optional on create (unlike Brand's mandatory logo) — a lender
      // can be added with just a name and have its logo filled in later.
      logoUrl: logoFilename ? buildPublicPath('lenders', logoFilename) : null,
      createdBy: actorId,
      updatedBy: actorId,
    },
    select: LENDER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created lender "${lender.name}" (id ${lender.id})`,
    ipAddress,
  });

  return lender;
}

export async function updateLender(
  id: number,
  input: UpdateLenderParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await getLenderById(id);

  const lender = await prisma.lender.update({
    where: { id },
    data: { ...input, updatedBy: actorId },
    select: LENDER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated lender "${lender.name}" (id ${lender.id})`,
    ipAddress,
  });

  return lender;
}

export async function updateLenderStatus(
  id: number,
  isActive: boolean,
  actorId: number,
  ipAddress?: string | null,
) {
  await getLenderById(id);

  const lender = await prisma.lender.update({
    where: { id },
    data: { isActive, updatedBy: actorId },
    select: LENDER_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} lender "${lender.name}" (id ${id})`,
    ipAddress,
  });

  return lender;
}

export async function deleteLender(id: number, actorId: number, ipAddress?: string | null) {
  const lender = await getLenderById(id);

  const loanLeadCount = await prisma.loanLead.count({ where: { lenderId: id } });
  if (loanLeadCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete this lender — ${loanLeadCount} loan lead(s) are linked to it. Reassign or resolve them first.`,
    );
  }

  await prisma.lender.delete({ where: { id } });

  // Lender row is gone — its logo file on disk (if any) is now orphaned,
  // clean it up. Same order-of-operations as brand.service.ts's deleteBrand.
  await deleteUploadedFile(lender.logoUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted lender "${lender.name}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Lender deleted successfully' };
}

export async function uploadLenderLogo(
  id: number,
  savedFilename: string,
  actorId: number,
  ipAddress?: string | null,
): Promise<LenderUploadLogoResult> {
  const existing = await getLenderById(id);

  const newLogoUrl = buildPublicPath('lenders', savedFilename);

  const lender = await prisma.lender.update({
    where: { id },
    data: { logoUrl: newLogoUrl, updatedBy: actorId },
    select: { id: true, logoUrl: true },
  });

  // Only delete the old file AFTER the DB write succeeds.
  await deleteUploadedFile(existing.logoUrl);

  await createLog({
    adminId: actorId,
    description: `Updated logo for lender "${existing.name}" (id ${id})`,
    ipAddress,
  });

  return lender as LenderUploadLogoResult;
}
