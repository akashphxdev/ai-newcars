// src/modules/public/leads/launchNotify/launchNotify.public.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { verifyLeadOtp } from '../leadOtp.service';
import type { CreateLaunchNotifyLeadParsed } from './launchNotify.public.validation';

export async function createLaunchNotifyLeadPublic(
  input: CreateLaunchNotifyLeadParsed,
  userId: number | null,
  ipAddress: string | null,
): Promise<{ id: number; duplicate: boolean }> {
  if (!userId) {
    if (!input.email || !input.otp) {
      throw ApiError.badRequest('Email and OTP are required to subscribe without logging in.');
    }
    await verifyLeadOtp(input.mobile, input.otp);
  }

  const model = await prisma.carModel.findUnique({
    where: { id: input.modelId },
    select: { id: true, brandId: true, launchStatus: true, expectedLaunchDate: true },
  });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
  // Nothing to notify about once it's already launched — this button
  // only ever renders for upcoming cars, so a mismatch here means a
  // stale page or a direct API call.
  if (model.launchStatus !== 'upcoming') {
    throw ApiError.badRequest('This car has already launched.');
  }

  // Already subscribed and still active — don't create a duplicate,
  // just confirm the existing one (same convention as priceDropAlert).
  const existing = await prisma.launchNotifyLead.findFirst({
    where: { mobile: input.mobile, modelId: input.modelId, isActive: true },
    select: { id: true },
  });
  if (existing) {
    return { id: existing.id, duplicate: true };
  }

  const lead = await prisma.launchNotifyLead.create({
    data: {
      userId,
      mobile: input.mobile,
      email: input.email ?? null,
      expectedLaunchDateAtSubscription: model.expectedLaunchDate,
      brandId: input.brandId ?? model.brandId,
      modelId: input.modelId,
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
