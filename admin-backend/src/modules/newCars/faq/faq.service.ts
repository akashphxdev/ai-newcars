// src/modules/newCars/faq/faq.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type { FaqListQueryParsed, CreateFaqParsed, UpdateFaqParsed } from './faq.validation';
import type { FaqRecord } from './faq.types';

const FAQ_SELECT = {
  id: true,
  modelId: true,
  question: true,
  answer: true,
  displayOrder: true,
  isActive: true,
  createdAt: true,
  model: {
    select: {
      id: true,
      name: true,
      brand: { select: { id: true, name: true } },
    },
  },
} as const;

export async function listFaqs(query: FaqListQueryParsed) {
  const { page, limit, search, modelId, isActive, sortBy, sortOrder } = query;

  const where: Prisma.CarFaqWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(search ? { question: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.carFaq.findMany({
      where,
      select: FAQ_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carFaq.count({ where }),
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

export async function getFaqById(id: number): Promise<FaqRecord> {
  const faq = await prisma.carFaq.findUnique({
    where: { id },
    select: FAQ_SELECT,
  });

  if (!faq) {
    throw ApiError.notFound('FAQ not found');
  }

  return faq as unknown as FaqRecord;
}

// Every FAQ must belong to a real, existing car model — same
// "validate the parent foreign key" rule as variant.service.ts's
// assertModelExists.
async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

// `(modelId, displayOrder)` IS @@unique in schema.prisma (DB-level) — this
// gives a friendly error before hitting the raw Prisma constraint. Same
// pattern as brand.service.ts's assertSlugAvailable.
async function assertDisplayOrderAvailable(modelId: number, displayOrder: number, excludeId?: number) {
  const conflict = await prisma.carFaq.findFirst({
    where: { modelId, displayOrder, id: excludeId ? { not: excludeId } : undefined },
    select: { id: true },
  });
  if (conflict) {
    throw ApiError.conflict(
      `Display order ${displayOrder} is already used by another FAQ for this car model`
    );
  }
}

export async function createFaq(input: CreateFaqParsed, actorId: number, ipAddress?: string | null) {
  await assertModelExists(input.modelId);
  await assertDisplayOrderAvailable(input.modelId, input.displayOrder);

  const faq = await prisma.carFaq.create({
    data: {
      modelId: input.modelId,
      question: input.question,
      answer: input.answer,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
    },
    select: FAQ_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Created FAQ "${faq.question}" (id ${faq.id}) for "${faq.model.brand.name} ${faq.model.name}"`,
    ipAddress,
  });

  return faq;
}

// Every field is required here too (per product requirement) — this is a
// full replace on every edit, not a partial PATCH like Brand/CarModel.
export async function updateFaq(
  id: number,
  input: UpdateFaqParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  await getFaqById(id);
  await assertModelExists(input.modelId);
  await assertDisplayOrderAvailable(input.modelId, input.displayOrder, id);

  const faq = await prisma.carFaq.update({
    where: { id },
    data: {
      modelId: input.modelId,
      question: input.question,
      answer: input.answer,
      displayOrder: input.displayOrder,
      isActive: input.isActive,
    },
    select: FAQ_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Updated FAQ "${faq.question}" (id ${id})`,
    ipAddress,
  });

  return faq;
}

// Lightweight row-level Active/Inactive toggle — separate from the full
// update so flipping the switch doesn't need the whole edit form's payload.
export async function updateFaqStatus(
  id: number,
  isActive: boolean,
  actorId: number,
  ipAddress?: string | null,
) {
  await getFaqById(id);

  const faq = await prisma.carFaq.update({
    where: { id },
    data: { isActive },
    select: FAQ_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} FAQ "${faq.question}" (id ${id})`,
    ipAddress,
  });

  return faq;
}

export async function deleteFaq(id: number, actorId: number, ipAddress?: string | null) {
  const faq = await getFaqById(id);

  await prisma.carFaq.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted FAQ "${faq.question}" (id ${id})`,
    ipAddress,
  });

  return { message: 'FAQ deleted successfully' };
}