// src/modules/public/leads/softLead/softLead.public.service.ts

import { prisma } from '@/prisma/client';
import type { CreateSoftLeadParsed } from './softLead.public.validation';

// Terminal statuses that DON'T block a fresh lead for the same
// mobile+calculator+brand+model — must stay in sync with admin's
// SOFT_LEAD_STATUSES (modules/buyLeads/softLeads/softLead.validation.ts).
const TERMINAL_STATUSES = ['converted', 'junk'];

// No OTP verification here (unlike createBuyNewCarLeadPublic) — soft
// leads are a deliberately low-friction capture off the calculator
// pages, mobile number only.
export async function createSoftLeadPublic(
  input: CreateSoftLeadParsed,
  userId: number | null,
  ipAddress: string | null,
): Promise<{ id: number; duplicate: boolean }> {
  const existing = await prisma.softLead.findFirst({
    where: {
      mobile: input.mobile,
      calculatorType: input.calculatorType,
      brandId: input.brandId ?? null,
      modelId: input.modelId ?? null,
      status: { notIn: TERMINAL_STATUSES },
    },
    select: { id: true },
  });

  if (existing) {
    // LeadActivity.adminId is NOT NULL (admin-only audit trail) — a
    // website re-submit has no admin actor, so it can't log an activity
    // row there. Bumping updatedAt is enough signal for the admin list
    // (same convention as newCarLead.public.service.ts).
    await prisma.softLead.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
    return { id: existing.id, duplicate: true };
  }

  const lead = await prisma.softLead.create({
    data: {
      userId,
      mobile: input.mobile,
      brandId: input.brandId ?? null,
      modelId: input.modelId ?? null,
      calculatorType: input.calculatorType,
      inputSummary: input.inputSummary ?? null,
      leadChannel: 'website',
      utmSource: input.utmSource ?? null,
      utmMedium: input.utmMedium ?? null,
      utmCampaign: input.utmCampaign ?? null,
      landingPage: input.landingPage ?? null,
      deviceType: input.deviceType ?? null,
      ipAddress: ipAddress ?? null,
    },
    select: { id: true },
  });

  return { id: lead.id, duplicate: false };
}
