// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

// Every super admin this seed guarantees exists. Add an entry here rather
// than duplicating the upsert below.
//
// `mobile` is a unique NOT NULL column but is not an auth channel — OTP is
// delivered by email (see auth.service.ts) — so a placeholder is enough to
// satisfy the constraint until a real number is set from the admin panel.
const SUPER_ADMINS = [
  { name: 'Akash Meena', email: 'akashmeena@phx.co.in', mobile: '7850986035' },
  { name: 'Super Admin', email: 'admin@timesauto.net', mobile: '0000000001' },
];

// Applies to every seeded account. Change it from the admin panel after
// the first login — it is in version control, so it is public.
const DEFAULT_PASSWORD = 'Admin@1234';

const ACCESS_YEARS = 10;

async function main() {
  console.log('Seeding database...');

  let superAdminRole = await prisma.role.findFirst({
    where: { roleName: 'Super Admin' },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        // No permission rows: Super Admin bypasses the permission check
        // entirely in requirePermission, so granting it every row would be
        // redundant and would go stale as new permissions are added.
        roleName: 'Super Admin',
      },
    });
    console.log(`Created role: ${superAdminRole.roleName} (id: ${superAdminRole.id})`);
  } else {
    console.log(`Role already exists: ${superAdminRole.roleName} (id: ${superAdminRole.id})`);
  }

  const accessStartDate = new Date();
  const accessEndDate = new Date();
  accessEndDate.setFullYear(accessEndDate.getFullYear() + ACCESS_YEARS);

  for (const entry of SUPER_ADMINS) {
    // Nothing is ever deleted — admin_logs and site_settings hold
    // ON DELETE RESTRICT references, so a wipe-and-recreate would fail
    // against any database that has actually been used.
    const existing = await prisma.adminUser.findUnique({ where: { email: entry.email } });

    if (existing) {
      // Deliberately does NOT touch passwordHash or mobile. This seed is
      // re-run whenever an entry is added to SUPER_ADMINS, and on a live
      // database that would reset every existing admin's password to the
      // default published in this file, and clobber any real number set
      // from the panel. Only the role and active status are re-asserted.
      const admin = await prisma.adminUser.update({
        where: { id: existing.id },
        data: { roleId: superAdminRole.id, status: 'active' },
      });
      console.log(`Admin already exists: ${admin.email} (id ${admin.id}) — password left unchanged`);
    } else {
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
      const admin = await prisma.adminUser.create({
        data: {
          name: entry.name,
          email: entry.email,
          mobile: entry.mobile,
          passwordHash,
          roleId: superAdminRole.id,
          status: 'active',
          accessStartDate,
          accessEndDate,
        },
      });
      console.log(
        `Created admin: ${admin.email} (id ${admin.id}) mobile ${admin.mobile} — ` +
          `access ${accessStartDate.toDateString()} to ${accessEndDate.toDateString()}`,
      );
    }
  }

  console.log(`\nNewly created admins use the password: ${DEFAULT_PASSWORD}`);
  console.log('Change it from the admin panel after first login.');
  console.log('Seeding finished.');
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
