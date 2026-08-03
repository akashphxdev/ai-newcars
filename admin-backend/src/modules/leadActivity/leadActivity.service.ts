// src/modules/leadActivity/leadActivity.service.ts
//
// Shared across every lead module (Buy Leads today, Sell Leads later) —
// LeadActivity is a single polymorphic table (leadType + leadId), not a
// per-lead-type activity table, so this lives outside buyLeads/.

import { prisma } from '@/prisma/client';

export const LEAD_TYPES = {
  BUY_NEW_CAR: 'buy_new_car',
  INSURANCE: 'insurance',
  PRICE_DROP_ALERT: 'price_drop_alert',
  SOFT_LEAD: 'soft_lead',
} as const;

export type LeadType = (typeof LEAD_TYPES)[keyof typeof LEAD_TYPES];

const LEAD_ACTIVITY_SELECT = {
  id: true,
  activityType: true,
  notes: true,
  createdAt: true,
  admin: { select: { id: true, name: true } },
} as const;

// BigInt id isn't JSON-serializable as-is — narrow to a regular number
// (same convention as adImpression.service.ts / adClick.service.ts).
function shapeActivity<T extends { id: bigint }>(row: T): Omit<T, 'id'> & { id: number } {
  return { ...row, id: Number(row.id) };
}

export interface LogLeadActivityInput {
  leadType: LeadType;
  leadId: number;
  adminId: number;
  activityType: 'status_change' | 'note';
  notes?: string | null;
}

export async function logLeadActivity(input: LogLeadActivityInput) {
  const activity = await prisma.leadActivity.create({
    data: {
      leadType: input.leadType,
      leadId: input.leadId,
      adminId: input.adminId,
      activityType: input.activityType,
      notes: input.notes ?? null,
    },
    select: LEAD_ACTIVITY_SELECT,
  });
  return shapeActivity(activity);
}

export async function getLeadActivityTimeline(leadType: LeadType, leadId: number) {
  const rows = await prisma.leadActivity.findMany({
    where: { leadType, leadId },
    select: LEAD_ACTIVITY_SELECT,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(shapeActivity);
}
