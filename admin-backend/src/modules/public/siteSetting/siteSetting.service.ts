// src/modules/public/siteSetting/siteSetting.service.ts

import { prisma } from '@/prisma/client';
import type { PublicSiteSettingRecord } from './siteSetting.types';

// Same singleton convention as the admin siteSetting module — earliest
// row is treated as "the" config. No row yet = maintenance mode is off.
export async function getPublicSiteSettings(): Promise<PublicSiteSettingRecord> {
  const row = await prisma.siteSetting.findFirst({
    orderBy: { id: 'asc' },
    select: {
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
    },
  });

  return (
    row ?? {
      maintenanceMode: false,
      maintenanceMessage: null,
      supportEmail: null,
      contactEmail: null,
      contactNumber: null,
      whatsappNumber: null,
      address: null,
      facebookUrl: null,
      instagramUrl: null,
      twitterUrl: null,
      youtubeUrl: null,
      linkedinUrl: null,
    }
  );
}
