// src/modules/public/leads/priceDropAlert/priceDropAlert.public.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { verifyLeadOtp } from '../leadOtp.service';
import type { CreatePriceDropAlertLeadParsed } from './priceDropAlert.public.validation';

export async function createPriceDropAlertLeadPublic(
  input: CreatePriceDropAlertLeadParsed,
  userId: number | null,
  ipAddress: string | null,
): Promise<{ id: number; duplicate: boolean }> {
  if (!userId) {
    if (!input.email || !input.otp) {
      throw ApiError.badRequest('Email and OTP are required to subscribe without logging in.');
    }
    await verifyLeadOtp(input.mobile, input.otp);
  }

  const model = await prisma.carModel.findUnique({ where: { id: input.modelId }, select: { id: true, brandId: true, priceMin: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }

  // Already subscribed and still active — don't create a duplicate
  // alert, just confirm the existing one.
  const existing = await prisma.priceDropAlertLead.findFirst({
    where: { mobile: input.mobile, modelId: input.modelId, isActive: true },
    select: { id: true },
  });
  if (existing) {
    return { id: existing.id, duplicate: true };
  }

  const lead = await prisma.priceDropAlertLead.create({
    data: {
      userId,
      mobile: input.mobile,
      email: input.email ?? null,
      // Never trust a client-supplied price — snapshot the model's
      // current starting price ourselves, at subscribe time.
      priceAtSubscription: model.priceMin,
      brandId: input.brandId ?? model.brandId,
      modelId: input.modelId,
      alertType: 'email',
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
