// src/modules/public/leads/newCarLead/newCarLead.public.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { verifyLeadOtp } from '../leadOtp.service';
import type { CreateBuyNewCarLeadParsed } from './newCarLead.public.validation';

// Terminal statuses that DON'T block a fresh lead for the same
// mobile+brand+model — must stay in sync with admin's
// BUY_NEW_CAR_LEAD_STATUSES (modules/buyLeads/newCarLeads/buyNewCarLead.validation.ts).
const TERMINAL_STATUSES = ['converted', 'junk'];

export async function createBuyNewCarLeadPublic(
  input: CreateBuyNewCarLeadParsed,
  userId: number | null,
  ipAddress: string | null,
): Promise<{ id: number; duplicate: boolean }> {
  if (!userId) {
    if (!input.email || !input.otp) {
      throw ApiError.badRequest('Email and OTP are required to submit this without logging in.');
    }
    await verifyLeadOtp(input.mobile, input.otp);
  }

  // Duplicate guard — same mobile + brand + model, still "open" — don't
  // pile up a fresh row, just signal the existing one was touched again.
  if (input.brandId && input.modelId) {
    const existing = await prisma.buyNewCarLead.findFirst({
      where: {
        mobile: input.mobile,
        brandId: input.brandId,
        modelId: input.modelId,
        status: { notIn: TERMINAL_STATUSES },
      },
      select: { id: true },
    });

    if (existing) {
      // LeadActivity.adminId is NOT NULL (admin-only audit trail) — a
      // website re-enquiry has no admin actor, so it can't log an
      // activity row there. Bumping updatedAt is enough signal for the
      // admin list (sorts/shows "last touched").
      await prisma.buyNewCarLead.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
      return { id: existing.id, duplicate: true };
    }
  }

  const lead = await prisma.buyNewCarLead.create({
    data: {
      userId,
      name: input.name ?? null,
      mobile: input.mobile,
      email: input.email ?? null,
      brandId: input.brandId ?? null,
      modelId: input.modelId ?? null,
      variantId: input.variantId ?? null,
      cityId: input.cityId ?? null,
      interestType: input.interestType ?? null,
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
