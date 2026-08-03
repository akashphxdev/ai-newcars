// src/modules/buyLeads/loanLeads/loanLead.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { logLeadActivity, getLeadActivityTimeline, LEAD_TYPES } from '@/modules/leadActivity/leadActivity.service';
import { startOfToday, startOfWeek, startOfMonth } from '@/core/utils/dateRanges';
import type { LoanLeadListQueryParsed, UpdateLoanLeadStatusParsed, AddLoanLeadActivityParsed } from './loanLead.validation';

const LOAN_LEAD_LIST_SELECT = {
  id: true,
  userId: true,
  name: true,
  mobile: true,
  brandId: true,
  brand: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true } },
  variantId: true,
  variant: { select: { id: true, variantName: true } },
  lenderId: true,
  lender: { select: { id: true, name: true, logoUrl: true } },
  loanAmount: true,
  tenureYears: true,
  interestRate: true,
  monthlyIncome: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const LOAN_LEAD_DETAIL_SELECT = {
  ...LOAN_LEAD_LIST_SELECT,
  leadChannel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  landingPage: true,
  deviceType: true,
  ipAddress: true,
} as const;

export async function listLoanLeads(query: LoanLeadListQueryParsed) {
  const { page, limit, search, status, brandId, modelId, lenderId, sortBy, sortOrder } = query;

  const where: Prisma.LoanLeadWhereInput = {
    ...(status ? { status } : {}),
    ...(brandId ? { brandId } : {}),
    ...(modelId ? { modelId } : {}),
    ...(lenderId ? { lenderId } : {}),
    ...(search
      ? {
          OR: [{ name: { contains: search, mode: 'insensitive' } }, { mobile: { contains: search, mode: 'insensitive' } }],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.loanLead.findMany({
      where,
      select: LOAN_LEAD_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loanLead.count({ where }),
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
  const lead = await prisma.loanLead.findUnique({ where: { id }, select: { id: true, name: true, mobile: true } });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  return lead;
}

// Activity timeline only fetched here (single-record view), never
// riding along with the list — same reasoning as insuranceLead.service.ts.
export async function getLoanLeadById(id: number) {
  const lead = await prisma.loanLead.findUnique({ where: { id }, select: LOAN_LEAD_DETAIL_SELECT });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  const activity = await getLeadActivityTimeline(LEAD_TYPES.LOAN, id);
  return { ...lead, activity };
}

export async function updateLoanLeadStatus(
  id: number,
  input: UpdateLoanLeadStatusParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertLeadExists(id);

  const lead = await prisma.loanLead.update({
    where: { id },
    data: { status: input.status },
    select: LOAN_LEAD_LIST_SELECT,
  });

  await logLeadActivity({
    leadType: LEAD_TYPES.LOAN,
    leadId: id,
    adminId: actorId,
    activityType: 'status_change',
    notes: input.note ?? `Status changed to "${input.status}"`,
  });

  await createLog({
    adminId: actorId,
    description: `Updated loan lead status to "${input.status}" for "${existing.name ?? existing.mobile}" (id ${id})`,
    ipAddress,
  });

  return lead;
}

// Independent of any list filter/pagination — same reasoning as
// buyNewCarLead.service.ts's getBuyNewCarLeadStats.
export async function getLoanLeadStats() {
  const [today, thisWeek, thisMonth, converted] = await Promise.all([
    prisma.loanLead.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.loanLead.count({ where: { createdAt: { gte: startOfWeek() } } }),
    prisma.loanLead.count({ where: { createdAt: { gte: startOfMonth() } } }),
    prisma.loanLead.count({ where: { status: 'converted' } }),
  ]);

  return { today, thisWeek, thisMonth, converted };
}

export async function addLoanLeadActivity(id: number, input: AddLoanLeadActivityParsed, actorId: number) {
  await assertLeadExists(id);

  return logLeadActivity({
    leadType: LEAD_TYPES.LOAN,
    leadId: id,
    adminId: actorId,
    activityType: 'note',
    notes: input.notes,
  });
}
