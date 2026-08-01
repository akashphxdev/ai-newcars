// src/modules/buyLeads/newCarLeads/buyNewCarLead.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { logLeadActivity, getLeadActivityTimeline, LEAD_TYPES } from '@/modules/leadActivity/leadActivity.service';
import { startOfToday, startOfWeek, startOfMonth } from '@/core/utils/dateRanges';
import type {
  BuyNewCarLeadListQueryParsed,
  UpdateBuyNewCarLeadStatusParsed,
  AddBuyNewCarLeadActivityParsed,
} from './buyNewCarLead.validation';

const BUY_NEW_CAR_LEAD_LIST_SELECT = {
  id: true,
  userId: true,
  name: true,
  mobile: true,
  email: true,
  brandId: true,
  brand: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true } },
  variantId: true,
  variant: { select: { id: true, variantName: true } },
  cityId: true,
  city: { select: { id: true, name: true } },
  interestType: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const BUY_NEW_CAR_LEAD_DETAIL_SELECT = {
  ...BUY_NEW_CAR_LEAD_LIST_SELECT,
  leadChannel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  landingPage: true,
  deviceType: true,
  ipAddress: true,
} as const;

export async function listBuyNewCarLeads(query: BuyNewCarLeadListQueryParsed) {
  const { page, limit, search, status, brandId, modelId, cityId, interestType, sortBy, sortOrder } = query;

  const where: Prisma.BuyNewCarLeadWhereInput = {
    ...(status ? { status } : {}),
    ...(brandId ? { brandId } : {}),
    ...(modelId ? { modelId } : {}),
    ...(cityId ? { cityId } : {}),
    ...(interestType ? { interestType } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.buyNewCarLead.findMany({
      where,
      select: BUY_NEW_CAR_LEAD_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.buyNewCarLead.count({ where }),
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

async function assertLeadExists(id: number) {
  const lead = await prisma.buyNewCarLead.findUnique({
    where: { id },
    select: { id: true, name: true, mobile: true },
  });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  return lead;
}

// Activity timeline only fetched here (single-record view), never
// riding along with the list — same reasoning as review.service.ts's
// replies/helpfulVotes.
export async function getBuyNewCarLeadById(id: number) {
  const lead = await prisma.buyNewCarLead.findUnique({ where: { id }, select: BUY_NEW_CAR_LEAD_DETAIL_SELECT });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  const activity = await getLeadActivityTimeline(LEAD_TYPES.BUY_NEW_CAR, id);
  return { ...lead, activity };
}

export async function updateBuyNewCarLeadStatus(
  id: number,
  input: UpdateBuyNewCarLeadStatusParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertLeadExists(id);

  const lead = await prisma.buyNewCarLead.update({
    where: { id },
    data: { status: input.status },
    select: BUY_NEW_CAR_LEAD_LIST_SELECT,
  });

  await logLeadActivity({
    leadType: LEAD_TYPES.BUY_NEW_CAR,
    leadId: id,
    adminId: actorId,
    activityType: 'status_change',
    notes: input.note ?? `Status changed to "${input.status}"`,
  });

  await createLog({
    adminId: actorId,
    description: `Updated buy-new-car lead status to "${input.status}" for "${existing.name ?? existing.mobile}" (id ${id})`,
    ipAddress,
  });

  return lead;
}

// Independent of any list filter/pagination — a dashboard-style summary
// always reflects the full table, same reasoning as
// modules/ai/dashboard's "today" counts.
export async function getBuyNewCarLeadStats() {
  const [today, thisWeek, thisMonth, converted] = await Promise.all([
    prisma.buyNewCarLead.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.buyNewCarLead.count({ where: { createdAt: { gte: startOfWeek() } } }),
    prisma.buyNewCarLead.count({ where: { createdAt: { gte: startOfMonth() } } }),
    prisma.buyNewCarLead.count({ where: { status: 'converted' } }),
  ]);

  return { today, thisWeek, thisMonth, converted };
}

export async function addBuyNewCarLeadActivity(id: number, input: AddBuyNewCarLeadActivityParsed, actorId: number) {
  await assertLeadExists(id);

  return logLeadActivity({
    leadType: LEAD_TYPES.BUY_NEW_CAR,
    leadId: id,
    adminId: actorId,
    activityType: 'note',
    notes: input.notes,
  });
}
