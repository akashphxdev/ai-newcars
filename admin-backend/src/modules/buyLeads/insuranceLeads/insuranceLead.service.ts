// src/modules/buyLeads/insuranceLeads/insuranceLead.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { logLeadActivity, getLeadActivityTimeline, LEAD_TYPES } from '@/modules/leadActivity/leadActivity.service';
import type {
  InsuranceLeadListQueryParsed,
  UpdateInsuranceLeadStatusParsed,
  AddInsuranceLeadActivityParsed,
} from './insuranceLead.validation';

const INSURANCE_LEAD_LIST_SELECT = {
  id: true,
  name: true,
  mobile: true,
  registrationNumber: true,
  brandId: true,
  brand: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true } },
  cityId: true,
  city: { select: { id: true, name: true } },
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const INSURANCE_LEAD_DETAIL_SELECT = {
  ...INSURANCE_LEAD_LIST_SELECT,
  leadChannel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  landingPage: true,
  deviceType: true,
  ipAddress: true,
} as const;

export async function listInsuranceLeads(query: InsuranceLeadListQueryParsed) {
  const { page, limit, search, status, brandId, modelId, cityId, sortBy, sortOrder } = query;

  const where: Prisma.InsuranceLeadWhereInput = {
    ...(status ? { status } : {}),
    ...(brandId ? { brandId } : {}),
    ...(modelId ? { modelId } : {}),
    ...(cityId ? { cityId } : {}),
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
    prisma.insuranceLead.findMany({
      where,
      select: INSURANCE_LEAD_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.insuranceLead.count({ where }),
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
  const lead = await prisma.insuranceLead.findUnique({
    where: { id },
    select: { id: true, name: true, mobile: true },
  });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  return lead;
}

export async function getInsuranceLeadById(id: number) {
  const lead = await prisma.insuranceLead.findUnique({ where: { id }, select: INSURANCE_LEAD_DETAIL_SELECT });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  const activity = await getLeadActivityTimeline(LEAD_TYPES.INSURANCE, id);
  return { ...lead, activity };
}

export async function updateInsuranceLeadStatus(
  id: number,
  input: UpdateInsuranceLeadStatusParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertLeadExists(id);

  const lead = await prisma.insuranceLead.update({
    where: { id },
    data: { status: input.status },
    select: INSURANCE_LEAD_LIST_SELECT,
  });

  await logLeadActivity({
    leadType: LEAD_TYPES.INSURANCE,
    leadId: id,
    adminId: actorId,
    activityType: 'status_change',
    notes: input.note ?? `Status changed to "${input.status}"`,
  });

  await createLog({
    adminId: actorId,
    description: `Updated insurance lead status to "${input.status}" for "${existing.name ?? existing.mobile}" (id ${id})`,
    ipAddress,
  });

  return lead;
}

export async function addInsuranceLeadActivity(id: number, input: AddInsuranceLeadActivityParsed, actorId: number) {
  await assertLeadExists(id);

  return logLeadActivity({
    leadType: LEAD_TYPES.INSURANCE,
    leadId: id,
    adminId: actorId,
    activityType: 'note',
    notes: input.notes,
  });
}
