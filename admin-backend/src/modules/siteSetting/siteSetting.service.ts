// src/modules/siteSetting/siteSetting.service.ts

import { prisma } from '@/prisma/client';
import { createLog } from '@/core/utils/createLog';
import type { UpsertSiteSettingParsed } from './siteSetting.validation';
import type { SiteSettingResponse } from './siteSetting.types';

const SETTING_SELECT = {
  id: true,
  maintenanceMode: true,
  maintenanceMessage: true,
  supportEmail: true,
  contactEmail: true,
  contactNumber: true,
  whatsappNumber: true,
  address: true,
  facebookUrl: true,
  instagramUrl: true,
  twitterUrl: true,
  youtubeUrl: true,
  linkedinUrl: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

// There is only ever one settings row in practice — the earliest one
// created is treated as "the" config, same singleton convention as
// AiSetting.
export async function getSettings(): Promise<SiteSettingResponse | null> {
  const row = await prisma.siteSetting.findFirst({
    orderBy: { id: 'asc' },
    select: SETTING_SELECT,
  });
  return row;
}

export async function upsertSettings(
  input: UpsertSiteSettingParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<SiteSettingResponse> {
  const existing = await prisma.siteSetting.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });

  const row = existing
    ? await prisma.siteSetting.update({
        where: { id: existing.id },
        data: {
          ...input,
          updatedBy: actorId,
        },
        select: SETTING_SELECT,
      })
    : await prisma.siteSetting.create({
        data: {
          ...input,
          createdBy: actorId,
          updatedBy: actorId,
        },
        select: SETTING_SELECT,
      });

  await createLog({
    adminId: actorId,
    description: existing ? 'Updated site settings' : 'Created site settings',
    ipAddress,
  });

  return row;
}