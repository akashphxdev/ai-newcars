// src/modules/public/siteSetting/siteSetting.service.ts

import { prisma } from '@/prisma/client';
import type { PublicSiteSettingRecord } from './siteSetting.types';

// Same singleton convention as the admin siteSetting module — earliest
// row is treated as "the" config. No row yet = maintenance mode is off.
export async function getPublicSiteSettings(): Promise<PublicSiteSettingRecord> {
  const row = await prisma.siteSetting.findFirst({
    orderBy: { id: 'asc' },
    select: { maintenanceMode: true, maintenanceMessage: true },
  });

  return row ?? { maintenanceMode: false, maintenanceMessage: null };
}
