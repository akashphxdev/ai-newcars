// src/modules/public/cities/city.public.service.ts
//
// Dropdown-only source for the website's lead-form city field — every
// city in one shot, unpaginated, same shape/query as admin's internal
// modules/locations/city/city.service.ts's listCityOptions(), just
// exposed without an admin token. stateId rides along so the insurance
// wizard's City field can filter to the selected Registration State.

import { prisma } from '@/prisma/client';

// sellCarOnly narrows the list to cities where we actually operate a
// buy/scrap service. Filtered here rather than in the browser so the
// response carries only the rows the form can use.
export async function listPublicCityOptions(sellCarOnly = false) {
  return prisma.city.findMany({
    where: sellCarOnly ? { isSellCarEnabled: true } : undefined,
    select: { id: true, name: true, stateId: true },
    orderBy: { name: 'asc' },
  });
}
