// src/modules/public/lenders/lender.public.service.ts
//
// Dropdown-only source for the website's Loan Lead form's "Preferred
// Lender" field — every ACTIVE lender in one shot, unpaginated, same
// pattern as modules/public/cities/city.public.service.ts. Only active
// lenders are ever shown publicly, unlike the admin list which can
// filter either way.

import { prisma } from '@/prisma/client';

export async function listPublicLenderOptions() {
  return prisma.lender.findMany({
    where: { isActive: true },
    select: { id: true, name: true, logoUrl: true, minInterestRate: true, maxInterestRate: true, maxLoanAmount: true, maxTenureYears: true },
    orderBy: { name: 'asc' },
  });
}
