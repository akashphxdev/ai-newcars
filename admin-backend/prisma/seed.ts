// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('Seeding database...');

  // 1. Create the Super Admin role if it doesn't exist
  let superAdminRole = await prisma.role.findFirst({
    where: { roleName: 'Super Admin' },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        roleName: 'Super Admin',
        permissionIds: [], // super admin bypasses permission checks in app logic
      },
    });
    console.log(`Created role: ${superAdminRole.roleName} (id: ${superAdminRole.id})`);
  } else {
    console.log(`Role already exists: ${superAdminRole.roleName} (id: ${superAdminRole.id})`);
  }

  // 2. Upsert the admin by email — same email already exists -> refresh
  // its password/mobile to the values below; doesn't exist -> create it.
  // Never deletes anything (no admin-wipe here — see prior conversation:
  // a hard delete-all would violate ON DELETE RESTRICT foreign keys from
  // admin_logs/site_settings/etc.).
  const adminEmail = 'akashmeena@phx.co.in';
  const adminMobile = '7850986035';
  const adminPassword = 'Admin@1234'; // change after first login

  const accessStartDate = new Date(); // access starts today
  const accessEndDate = new Date();
  accessEndDate.setFullYear(accessEndDate.getFullYear() + 10); // valid for 10 years

  const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    const admin = await prisma.adminUser.update({
      where: { id: existingAdmin.id },
      data: {
        mobile: adminMobile,
        passwordHash,
        roleId: superAdminRole.id,
        status: 'active',
      },
    });

    console.log('Existing admin updated:');
    console.log(`  Email:            ${admin.email}`);
    console.log(`  Mobile:           ${admin.mobile}`);
    console.log(`  Password:         ${adminPassword}`);
    console.log('  (Change this password after logging in)');
  } else {
    const admin = await prisma.adminUser.create({
      data: {
        name: 'Super Admin',
        email: adminEmail,
        mobile: adminMobile,
        passwordHash,
        roleId: superAdminRole.id,
        status: 'active',
        accessStartDate,
        accessEndDate,
      },
    });

    console.log('New admin created successfully:');
    console.log(`  Email:            ${admin.email}`);
    console.log(`  Mobile:           ${admin.mobile}`);
    console.log(`  Password:         ${adminPassword}`);
    console.log(`  Access start:     ${accessStartDate.toDateString()}`);
    console.log(`  Access end:       ${accessEndDate.toDateString()}`);
    console.log('  (Change this password after first login)');
  }

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