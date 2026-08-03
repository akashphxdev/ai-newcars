// src/modules/public/states/state.public.service.ts
//
// Dropdown-only source for the website's insurance lead form's
// Registration State field — every state in one shot, unpaginated,
// same shape/pattern as modules/public/cities/city.public.service.ts.

import { prisma } from '@/prisma/client';

export async function listPublicStateOptions() {
  return prisma.state.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
