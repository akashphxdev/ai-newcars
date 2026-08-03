// src/modules/buyLeads/softLeads/softLead.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { logLeadActivity, getLeadActivityTimeline, LEAD_TYPES } from '@/modules/leadActivity/leadActivity.service';
import { startOfToday, startOfWeek, startOfMonth } from '@/core/utils/dateRanges';
import type { SoftLeadListQueryParsed, UpdateSoftLeadStatusParsed, AddSoftLeadActivityParsed } from './softLead.validation';

const SOFT_LEAD_LIST_SELECT = {
  id: true,
  userId: true,
  mobile: true,
  brandId: true,
  brand: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true } },
  calculatorType: true,
  inputSummary: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const SOFT_LEAD_DETAIL_SELECT = {
  ...SOFT_LEAD_LIST_SELECT,
  leadChannel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  landingPage: true,
  deviceType: true,
  ipAddress: true,
} as const;

export async function listSoftLeads(query: SoftLeadListQueryParsed) {
  const { page, limit, search, status, brandId, modelId, calculatorType, sortBy, sortOrder } = query;

  const where: Prisma.SoftLeadWhereInput = {
    ...(status ? { status } : {}),
    ...(brandId ? { brandId } : {}),
    ...(modelId ? { modelId } : {}),
    ...(calculatorType ? { calculatorType } : {}),
    ...(search ? { mobile: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.softLead.findMany({
      where,
      select: SOFT_LEAD_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.softLead.count({ where }),
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
  const lead = await prisma.softLead.findUnique({ where: { id }, select: { id: true, mobile: true } });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  return lead;
}

// Activity timeline only fetched here (single-record view), never
// riding along with the list — same reasoning as buyNewCarLead.service.ts.
export async function getSoftLeadById(id: number) {
  const lead = await prisma.softLead.findUnique({ where: { id }, select: SOFT_LEAD_DETAIL_SELECT });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  const activity = await getLeadActivityTimeline(LEAD_TYPES.SOFT_LEAD, id);
  return { ...lead, activity };
}

export async function updateSoftLeadStatus(
  id: number,
  input: UpdateSoftLeadStatusParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertLeadExists(id);

  const lead = await prisma.softLead.update({
    where: { id },
    data: { status: input.status },
    select: SOFT_LEAD_LIST_SELECT,
  });

  await logLeadActivity({
    leadType: LEAD_TYPES.SOFT_LEAD,
    leadId: id,
    adminId: actorId,
    activityType: 'status_change',
    notes: input.note ?? `Status changed to "${input.status}"`,
  });

  await createLog({
    adminId: actorId,
    description: `Updated soft lead status to "${input.status}" for "${existing.mobile ?? 'id ' + id}"`,
    ipAddress,
  });

  return lead;
}

// Independent of any list filter/pagination — same reasoning as
// buyNewCarLead.service.ts's getBuyNewCarLeadStats.
export async function getSoftLeadStats() {
  const [today, thisWeek, thisMonth, converted] = await Promise.all([
    prisma.softLead.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.softLead.count({ where: { createdAt: { gte: startOfWeek() } } }),
    prisma.softLead.count({ where: { createdAt: { gte: startOfMonth() } } }),
    prisma.softLead.count({ where: { status: 'converted' } }),
  ]);

  return { today, thisWeek, thisMonth, converted };
}

export async function addSoftLeadActivity(id: number, input: AddSoftLeadActivityParsed, actorId: number) {
  await assertLeadExists(id);

  return logLeadActivity({
    leadType: LEAD_TYPES.SOFT_LEAD,
    leadId: id,
    adminId: actorId,
    activityType: 'note',
    notes: input.notes,
  });
}
