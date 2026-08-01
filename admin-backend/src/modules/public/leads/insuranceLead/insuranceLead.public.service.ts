// src/modules/public/leads/insuranceLead/insuranceLead.public.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { verifyLeadOtp } from '../leadOtp.service';
import type { CreateInsuranceLeadParsed } from './insuranceLead.public.validation';

// Must stay in sync with admin's INSURANCE_LEAD_STATUSES
// (modules/buyLeads/insuranceLeads/insuranceLead.validation.ts).
const TERMINAL_STATUSES = ['converted', 'junk'];

export async function createInsuranceLeadPublic(
  input: CreateInsuranceLeadParsed,
  userId: number | null,
  ipAddress: string | null,
): Promise<{ id: number; duplicate: boolean }> {
  if (!userId) {
    if (!input.email || !input.otp) {
      throw ApiError.badRequest('Email and OTP are required to submit this without logging in.');
    }
    await verifyLeadOtp(input.mobile, input.otp);
  }

  if (input.brandId && input.modelId) {
    const existing = await prisma.insuranceLead.findFirst({
      where: {
        mobile: input.mobile,
        brandId: input.brandId,
        modelId: input.modelId,
        status: { notIn: TERMINAL_STATUSES },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.insuranceLead.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
      return { id: existing.id, duplicate: true };
    }
  }

  const lead = await prisma.insuranceLead.create({
    data: {
      userId,
      name: input.name ?? null,
      mobile: input.mobile,
      registrationNumber: input.registrationNumber ?? null,
      brandId: input.brandId ?? null,
      modelId: input.modelId ?? null,
      cityId: input.cityId ?? null,
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
