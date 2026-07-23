// prisma/seed-site-settings.ts
//
// One-off script: creates the single SiteSetting row using whichever
// AdminUser already exists (doesn't depend on the hardcoded admin
// email/mobile used in seed.ts). Safe to re-run — skips if a row
// already exists.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding site settings...');

  const existingSiteSetting = await prisma.siteSetting.findFirst();

  if (existingSiteSetting) {
    console.log(`Site settings already exist (id: ${existingSiteSetting.id}). Nothing to do.`);
    return;
  }

  // Grab any existing admin — prefer the oldest one (first created).
  const anyAdmin = await prisma.adminUser.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!anyAdmin) {
    console.error('No AdminUser found in the database. Create an admin first, then re-run this script.');
    process.exit(1);
    return; // unreachable at runtime, but lets TS narrow anyAdmin below
  }

  const siteSetting = await prisma.siteSetting.create({
    data: {
      maintenanceMode: false,
      createdBy: anyAdmin.id,
      updatedBy: anyAdmin.id,
    },
  });

  console.log('Created default site settings:');
  console.log(`  id:        ${siteSetting.id}`);
  console.log(`  createdBy: ${anyAdmin.email} (id: ${anyAdmin.id})`);
  console.log('  (All other fields are null — fill them in via the admin panel.)');
}

main()
  .catch((err) => {
    console.error('Seeding site settings failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });