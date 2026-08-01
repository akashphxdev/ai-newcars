// src/modules/buyLeads/priceDropAlerts/priceDropAlertLead.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { logLeadActivity, getLeadActivityTimeline, LEAD_TYPES } from '@/modules/leadActivity/leadActivity.service';
import { startOfToday, startOfMonth } from '@/core/utils/dateRanges';
import type {
  PriceDropAlertLeadListQueryParsed,
  UpdatePriceDropAlertLeadActiveParsed,
  AddPriceDropAlertLeadActivityParsed,
} from './priceDropAlertLead.validation';

const PRICE_DROP_ALERT_LEAD_LIST_SELECT = {
  id: true,
  userId: true,
  mobile: true,
  email: true,
  priceAtSubscription: true,
  brandId: true,
  brand: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true, priceMin: true } },
  alertType: true,
  isActive: true,
  notifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const PRICE_DROP_ALERT_LEAD_DETAIL_SELECT = {
  ...PRICE_DROP_ALERT_LEAD_LIST_SELECT,
  leadChannel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  landingPage: true,
  deviceType: true,
  ipAddress: true,
} as const;

// Decimal fields aren't JSON-serializable as a number without losing
// precision guarantees — stringify, same convention as
// review.service.ts's rating / compare.service.ts's price fields.
function shapeLead<
  T extends {
    priceAtSubscription: Prisma.Decimal | null;
    model: { priceMin: Prisma.Decimal | null } | null;
  },
>(row: T) {
  const { model, ...rest } = row;
  return {
    ...rest,
    priceAtSubscription: rest.priceAtSubscription?.toString() ?? null,
    model: model ? { ...model, priceMin: model.priceMin?.toString() ?? null } : null,
  };
}

export async function listPriceDropAlertLeads(query: PriceDropAlertLeadListQueryParsed) {
  const { page, limit, search, isActive, brandId, modelId, alertType, sortBy, sortOrder } = query;

  const where: Prisma.PriceDropAlertLeadWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(brandId ? { brandId } : {}),
    ...(modelId ? { modelId } : {}),
    ...(alertType ? { alertType } : {}),
    ...(search
      ? {
          OR: [
            { mobile: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.priceDropAlertLead.findMany({
      where,
      select: PRICE_DROP_ALERT_LEAD_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.priceDropAlertLead.count({ where }),
  ]);

  return {
    items: items.map(shapeLead),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function assertLeadExists(id: number) {
  const lead = await prisma.priceDropAlertLead.findUnique({
    where: { id },
    select: { id: true, mobile: true },
  });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  return lead;
}

export async function getPriceDropAlertLeadById(id: number) {
  const lead = await prisma.priceDropAlertLead.findUnique({ where: { id }, select: PRICE_DROP_ALERT_LEAD_DETAIL_SELECT });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  const activity = await getLeadActivityTimeline(LEAD_TYPES.PRICE_DROP_ALERT, id);
  return { ...shapeLead(lead), activity };
}

// Independent of any list filter/pagination — same reasoning as
// buyNewCarLead.service.ts's getBuyNewCarLeadStats.
export async function getPriceDropAlertLeadStats() {
  const [today, thisMonth, active] = await Promise.all([
    prisma.priceDropAlertLead.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.priceDropAlertLead.count({ where: { createdAt: { gte: startOfMonth() } } }),
    prisma.priceDropAlertLead.count({ where: { isActive: true } }),
  ]);

  return { today, thisMonth, active };
}

export async function updatePriceDropAlertLeadActive(
  id: number,
  input: UpdatePriceDropAlertLeadActiveParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertLeadExists(id);

  const lead = await prisma.priceDropAlertLead.update({
    where: { id },
    data: { isActive: input.isActive },
    select: PRICE_DROP_ALERT_LEAD_LIST_SELECT,
  });

  await logLeadActivity({
    leadType: LEAD_TYPES.PRICE_DROP_ALERT,
    leadId: id,
    adminId: actorId,
    activityType: 'status_change',
    notes: input.note ?? `Alert ${input.isActive ? 'activated' : 'deactivated'}`,
  });

  await createLog({
    adminId: actorId,
    description: `${input.isActive ? 'Activated' : 'Deactivated'} price-drop alert for "${existing.mobile}" (id ${id})`,
    ipAddress,
  });

  return shapeLead(lead);
}

export async function addPriceDropAlertLeadActivity(
  id: number,
  input: AddPriceDropAlertLeadActivityParsed,
  actorId: number,
) {
  await assertLeadExists(id);

  return logLeadActivity({
    leadType: LEAD_TYPES.PRICE_DROP_ALERT,
    leadId: id,
    adminId: actorId,
    activityType: 'note',
    notes: input.notes,
  });
}
