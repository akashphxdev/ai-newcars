// src/prisma/seedRbac.ts
//
// Run once (and any time you add a new module) to bootstrap permissions
// and make sure the "Super Admin" role always has every permission.
//
//   npx ts-node src/prisma/seedRbac.ts
//
// Why this file exists: requirePermission() denies access if a role has
// no matching permission. Without seeding, even the Super Admin would
// get locked out of every protected route the first time RBAC is turned on.
//
// CHANGED (format migration):
//   - permissionKey format changed from "module:action" -> "module.action"
//   - ACTIONS trimmed from 7 to 4: view, create, update, delete
//     (lock/export/approve removed — "lock" is now covered by "update")
//
// IMPORTANT: this script WIPES all existing Permission rows first, then
// re-creates them in the new format. Permission IDs are auto-increment,
// so every role's `permissionIds` array (which stores raw Permission row
// IDs) becomes stale the moment old permissions are deleted — those IDs
// no longer point to anything. To avoid roles silently holding broken/
// wrong permissions, this script resets EVERY role's permissionIds to an
// empty array, then re-grants the full new permission set only to
// "Super Admin". Any other role you had configured will need its
// permissions re-checked/re-assigned from the Roles page after running
// this script.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULES = ['admins', 'roles', 'permissions', 'leads', 'cars', 'stories', 'seo', 'ads'] as const;
const ACTIONS = ['view', 'create', 'update', 'delete'] as const; // CHANGED: lock/export/approve removed

async function main() {
  console.log('Step 1/4: Clearing stale permissionIds from all roles (old permission IDs are about to be invalidated)...');
  const roleResetResult = await prisma.role.updateMany({
    data: { permissionIds: [] },
  });
  console.log(`Reset permissionIds on ${roleResetResult.count} role(s).`);

  console.log('Step 2/4: Deleting old permissions (old "module:action" format)...');
  const deleteResult = await prisma.permission.deleteMany({});
  console.log(`Deleted ${deleteResult.count} old permission row(s).`);

  console.log('Step 3/4: Inserting permissions in new "module.action" format...');
  const createdPermissionIds: number[] = [];

  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const permissionKey = `${module}.${action}`; // CHANGED: dot instead of colon
      const permission = await prisma.permission.create({
        data: { module, action, permissionKey },
      });
      createdPermissionIds.push(permission.id);
    }
  }

  console.log(`Inserted ${createdPermissionIds.length} permissions.`);

  console.log('Step 4/4: Granting "Super Admin" role all permissions...');

  const superAdminRole = await prisma.role.findFirst({ where: { roleName: 'Super Admin' } });

  if (superAdminRole) {
    await prisma.role.update({
      where: { id: superAdminRole.id },
      data: { permissionIds: createdPermissionIds },
    });
    console.log(`Updated existing "Super Admin" role (id ${superAdminRole.id}) with all ${createdPermissionIds.length} permissions.`);
  } else {
    const created = await prisma.role.create({
      data: {
        roleName: 'Super Admin',
        permissionIds: createdPermissionIds,
      },
    });
    console.log(`Created "Super Admin" role (id ${created.id}) with all ${createdPermissionIds.length} permissions.`);
  }

  // Warn about any other roles that now have zero permissions and need
  // to be re-configured manually from the Roles page.
  const otherRoles = await prisma.role.findMany({
    where: { roleName: { not: 'Super Admin' } },
    select: { id: true, roleName: true },
  });

  if (otherRoles.length > 0) {
    console.log('');
    console.log('⚠️  The following roles had their permissions reset and need to be re-assigned from the Roles page:');
    for (const r of otherRoles) {
      console.log(`   - "${r.roleName}" (id ${r.id})`);
    }
  }

  console.log('');
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });