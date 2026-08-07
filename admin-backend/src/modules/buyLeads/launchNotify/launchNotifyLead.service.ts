// src/modules/buyLeads/launchNotify/launchNotifyLead.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { logLeadActivity, getLeadActivityTimeline, LEAD_TYPES } from '@/modules/leadActivity/leadActivity.service';
import { startOfToday, startOfMonth } from '@/core/utils/dateRanges';
import type {
  LaunchNotifyLeadListQueryParsed,
  UpdateLaunchNotifyLeadActiveParsed,
  AddLaunchNotifyLeadActivityParsed,
} from './launchNotifyLead.validation';

const LAUNCH_NOTIFY_LEAD_LIST_SELECT = {
  id: true,
  userId: true,
  mobile: true,
  email: true,
  expectedLaunchDateAtSubscription: true,
  brandId: true,
  brand: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true, launchStatus: true, expectedLaunchDate: true } },
  isActive: true,
  notifiedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const LAUNCH_NOTIFY_LEAD_DETAIL_SELECT = {
  ...LAUNCH_NOTIFY_LEAD_LIST_SELECT,
  leadChannel: true,
  utmSource: true,
  utmMedium: true,
  utmCampaign: true,
  landingPage: true,
  deviceType: true,
  ipAddress: true,
} as const;

export async function listLaunchNotifyLeads(query: LaunchNotifyLeadListQueryParsed) {
  const { page, limit, search, isActive, brandId, modelId, sortBy, sortOrder } = query;

  const where: Prisma.LaunchNotifyLeadWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(brandId ? { brandId } : {}),
    ...(modelId ? { modelId } : {}),
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
    prisma.launchNotifyLead.findMany({
      where,
      select: LAUNCH_NOTIFY_LEAD_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.launchNotifyLead.count({ where }),
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
  const lead = await prisma.launchNotifyLead.findUnique({
    where: { id },
    select: { id: true, mobile: true },
  });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  return lead;
}

export async function getLaunchNotifyLeadById(id: number) {
  const lead = await prisma.launchNotifyLead.findUnique({ where: { id }, select: LAUNCH_NOTIFY_LEAD_DETAIL_SELECT });
  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }
  const activity = await getLeadActivityTimeline(LEAD_TYPES.LAUNCH_NOTIFY, id);
  return { ...lead, activity };
}

// Independent of any list filter/pagination — same reasoning as
// priceDropAlertLead.service.ts's getPriceDropAlertLeadStats.
export async function getLaunchNotifyLeadStats() {
  const [today, thisMonth, active] = await Promise.all([
    prisma.launchNotifyLead.count({ where: { createdAt: { gte: startOfToday() } } }),
    prisma.launchNotifyLead.count({ where: { createdAt: { gte: startOfMonth() } } }),
    prisma.launchNotifyLead.count({ where: { isActive: true } }),
  ]);

  return { today, thisMonth, active };
}

export async function updateLaunchNotifyLeadActive(
  id: number,
  input: UpdateLaunchNotifyLeadActiveParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertLeadExists(id);

  const lead = await prisma.launchNotifyLead.update({
    where: { id },
    data: { isActive: input.isActive },
    select: LAUNCH_NOTIFY_LEAD_LIST_SELECT,
  });

  await logLeadActivity({
    leadType: LEAD_TYPES.LAUNCH_NOTIFY,
    leadId: id,
    adminId: actorId,
    activityType: 'status_change',
    notes: input.note ?? `Alert ${input.isActive ? 'activated' : 'deactivated'}`,
  });

  await createLog({
    adminId: actorId,
    description: `${input.isActive ? 'Activated' : 'Deactivated'} launch-notify alert for "${existing.mobile}" (id ${id})`,
    ipAddress,
  });

  return lead;
}

export async function addLaunchNotifyLeadActivity(
  id: number,
  input: AddLaunchNotifyLeadActivityParsed,
  actorId: number,
) {
  await assertLeadExists(id);

  return logLeadActivity({
    leadType: LEAD_TYPES.LAUNCH_NOTIFY,
    leadId: id,
    adminId: actorId,
    activityType: 'note',
    notes: input.notes,
  });
}
