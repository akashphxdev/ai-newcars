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

  // 2. Create the first admin user if it doesn't exist
  const adminEmail = 'admin@timesauto.in';
  const adminMobile = '9999999999';
  const adminPassword = 'Admin@1234'; // change after first login

  const accessStartDate = new Date(); // access starts today
  const accessEndDate = new Date();
  accessEndDate.setFullYear(accessEndDate.getFullYear() + 10); // valid for 10 years

  const existingAdmin = await prisma.adminUser.findFirst({
    where: { OR: [{ email: adminEmail }, { mobile: adminMobile }] },
  });

  if (existingAdmin) {
    console.log(`Admin already exists: ${existingAdmin.email}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

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

    console.log('First admin created successfully:');
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