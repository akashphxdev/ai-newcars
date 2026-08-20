// src/modules/public/leads/scrapLead/scrapLead.public.service.ts

import { prisma } from '@/prisma/client';
import type { CreateScrapLeadParsed } from './scrapLead.public.validation';

// Must stay in sync with admin's SCRAP_LEAD_STATUSES
// (modules/sellLeads/scrapLeads/scrapLead.validation.ts).
const TERMINAL_STATUSES = ['scrapped', 'converted', 'junk'];

export async function createScrapLeadPublic(
  input: CreateScrapLeadParsed,
  userId: number | null,
  ipAddress: string | null,
): Promise<{ id: number; duplicate: boolean }> {
  // Deduped on the registration number rather than the car, because one
  // owner scrapping two vehicles is a genuine second lead while the same
  // vehicle submitted twice is not. Falls back to doing nothing when no
  // registration was given — there is nothing reliable to match on, and
  // dropping a real lead is worse than handling a duplicate.
  if (input.registrationNumber) {
    const existing = await prisma.scrapCarLead.findFirst({
      where: {
        mobile: input.mobile,
        registrationNumber: input.registrationNumber,
        status: { notIn: TERMINAL_STATUSES },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.scrapCarLead.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
      return { id: existing.id, duplicate: true };
    }
  }

  const lead = await prisma.scrapCarLead.create({
    data: {
      userId,
      name: input.name ?? null,
      mobile: input.mobile,
      email: input.email ?? null,
      brandId: input.brandId ?? null,
      modelId: input.modelId ?? null,
      brandName: input.brandName ?? null,
      modelName: input.modelName ?? null,
      registrationNumber: input.registrationNumber ?? null,
      registrationYear: input.registrationYear ?? null,
      registrationStateId: input.registrationStateId ?? null,
      cityId: input.cityId ?? null,
      fuelType: input.fuelType ?? null,
      vehicleCondition: input.vehicleCondition ?? null,
      hasOriginalRc: input.hasOriginalRc ?? null,
      isHypothecated: input.isHypothecated ?? null,
      hasPendingChallan: input.hasPendingChallan ?? null,
      wantsCertificateOfDeposit: input.wantsCertificateOfDeposit ?? null,
      preferredPickupDate: input.preferredPickupDate ?? null,
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
