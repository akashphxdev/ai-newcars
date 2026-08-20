// src/modules/sellLeads/scrapLeads/scrapLead.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { logLeadActivity, getLeadActivityTimeline, LEAD_TYPES } from '@/modules/leadActivity/leadActivity.service';
import type {
  ScrapLeadListQueryParsed,
  UpdateScrapLeadStatusParsed,
  UpdateScrapLeadQuoteParsed,
  AddScrapLeadActivityParsed,
} from './scrapLead.validation';

const SCRAP_LEAD_LIST_SELECT = {
  id: true,
  name: true,
  mobile: true,
  brandId: true,
  brand: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true } },
  brandName: true,
  modelName: true,
  registrationNumber: true,
  registrationYear: true,
  cityId: true,
  city: { select: { id: true, name: true } },
  vehicleCondition: true,
  quotedPrice: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const SCRAP_LEAD_DETAIL_SELECT = {
  ...SCRAP_LEAD_LIST_SELECT,
  email: true,
  registrationStateId: true,
  registrationState: { select: { id: true, name: true } },
  fuelType: true,
  hasOriginalRc: true,
  isHypothecated: true,
  hasPendingChallan: true,
  wantsCertificateOfDeposit: true,
  preferredPickupDate: true,
  notes: true,
  leadChannel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  landingPage: true,
  deviceType: true,
  ipAddress: true,
} as const;

export async function listScrapLeads(query: ScrapLeadListQueryParsed) {
  const { page, limit, search, status, cityId, vehicleCondition, sortBy, sortOrder } = query;

  const where: Prisma.ScrapCarLeadWhereInput = {
    ...(status ? { status } : {}),
    ...(cityId ? { cityId } : {}),
    ...(vehicleCondition ? { vehicleCondition } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
            { registrationNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.scrapCarLead.findMany({
      where,
      select: SCRAP_LEAD_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scrapCarLead.count({ where }),
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
  const lead = await prisma.scrapCarLead.findUnique({
    where: { id },
    select: { id: true, name: true, mobile: true },
  });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  return lead;
}

export async function getScrapLeadById(id: number) {
  const lead = await prisma.scrapCarLead.findUnique({ where: { id }, select: SCRAP_LEAD_DETAIL_SELECT });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  const activity = await getLeadActivityTimeline(LEAD_TYPES.SCRAP_CAR, id);
  return { ...lead, activity };
}

export async function updateScrapLeadStatus(
  id: number,
  input: UpdateScrapLeadStatusParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertLeadExists(id);

  const lead = await prisma.scrapCarLead.update({
    where: { id },
    data: { status: input.status },
    select: SCRAP_LEAD_LIST_SELECT,
  });

  await logLeadActivity({
    leadType: LEAD_TYPES.SCRAP_CAR,
    leadId: id,
    adminId: actorId,
    activityType: 'status_change',
    notes: input.note ?? `Status changed to "${input.status}"`,
  });

  await createLog({
    adminId: actorId,
    description: `Updated scrap lead status to "${input.status}" for "${existing.name ?? existing.mobile}" (id ${id})`,
    ipAddress,
  });

  return lead;
}

// Recording the quote is its own action rather than part of the status
// change: the number is what the yard committed to, and it wants a
// timeline entry of its own so a later dispute can be traced.
export async function updateScrapLeadQuote(
  id: number,
  input: UpdateScrapLeadQuoteParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertLeadExists(id);

  const lead = await prisma.scrapCarLead.update({
    where: { id },
    data: {
      quotedPrice: new Prisma.Decimal(input.quotedPrice),
      status: 'quoted',
      ...(input.notes ? { notes: input.notes } : {}),
    },
    select: SCRAP_LEAD_LIST_SELECT,
  });

  await logLeadActivity({
    leadType: LEAD_TYPES.SCRAP_CAR,
    leadId: id,
    adminId: actorId,
    activityType: 'status_change',
    notes: input.notes ?? `Quoted ${input.quotedPrice}`,
  });

  await createLog({
    adminId: actorId,
    description: `Quoted ${input.quotedPrice} on scrap lead "${existing.name ?? existing.mobile}" (id ${id})`,
    ipAddress,
  });

  return lead;
}

export async function addScrapLeadActivity(id: number, input: AddScrapLeadActivityParsed, actorId: number) {
  await assertLeadExists(id);

  return logLeadActivity({
    leadType: LEAD_TYPES.SCRAP_CAR,
    leadId: id,
    adminId: actorId,
    activityType: 'note',
    notes: input.notes,
  });
}
