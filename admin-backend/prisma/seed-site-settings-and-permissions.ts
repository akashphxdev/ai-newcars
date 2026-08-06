// prisma/seed-site-settings-and-permissions.ts
//
// Run with:
//   npx tsx prisma/seed-site-settings-and-permissions.ts
// Permissions seed regardless of order. Site settings needs at least one
// AdminUser to exist (for its createdBy/updatedBy) — if none exists yet,
// that one step is skipped with a warning and this script still finishes;
// run seed.ts then re-run this one to pick up the site settings row.
//
// Replaces the old seed-site-settings.ts — does that same job, plus seeds
// every permission key the routes actually check for.
//
// Safe to re-run, NEVER creates duplicates:
//   - site settings: skipped entirely if a row already exists (findFirst
//     check before create)
//   - permissions: createMany({ skipDuplicates: true }) — permissionKey
//     is @unique in the schema, so re-running only inserts keys that
//     aren't already in the table; existing ones are silently skipped,
//     not re-inserted or duplicated.
//
// NOTE: several keys below (e.g. "ai.image-pool.upload", "reviews.moderate",
// "ad-placements.view") don't fit the admin panel's "Add Permission" form
// validation (permission.validation.ts only allows module = [a-z_]+ and
// action = view/create/update/delete — no hyphens, no "moderate"/"upload").
// That form would reject re-creating these by hand if one were ever
// deleted, so this script inserts them directly instead of going through
// that validated endpoint. Flagging this as a pre-existing gap worth
// fixing in permission.validation.ts at some point — not fixed here.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Every permission key currently referenced by `requirePermission(...)`
// across src/routes/v1/**/*.routes.ts (grep-extracted — keep in sync
// whenever a route adds a new key).
const PERMISSION_KEYS = [
  'ad-advertisers.create', 'ad-advertisers.delete', 'ad-advertisers.update', 'ad-advertisers.view',
  'ad-campaigns.create', 'ad-campaigns.delete', 'ad-campaigns.update', 'ad-campaigns.view',
  'ad-clicks.delete', 'ad-clicks.view',
  'ad-impressions.delete', 'ad-impressions.view',
  'dashboard.view',
  'ad-placements.create', 'ad-placements.delete', 'ad-placements.update', 'ad-placements.view',
  'adminlogs.view',
  'ai.articles.delete', 'ai.articles.update', 'ai.articles.view',
  'ai.automation-rules.update', 'ai.automation-rules.view',
  'ai.dashboard.view',
  'ai.faqs.delete', 'ai.faqs.update', 'ai.faqs.view',
  'ai.image-pool.delete', 'ai.image-pool.upload', 'ai.image-pool.view',
  'ai.logs.view',
  'ai.settings.update', 'ai.settings.view',
  'ai.story-items.delete', 'ai.story-items.update', 'ai.story-items.view',
  'alladmins.create', 'alladmins.delete', 'alladmins.update', 'alladmins.view',
  'article-categories.create', 'article-categories.delete', 'article-categories.update', 'article-categories.view',
  'article-comments.delete', 'article-comments.moderate', 'article-comments.view',
  'articles.create', 'articles.delete', 'articles.update', 'articles.view',
  'attribute-options.create', 'attribute-options.delete', 'attribute-options.update', 'attribute-options.view',
  'banners.create', 'banners.delete', 'banners.update', 'banners.view',
  'bodytypes.create', 'bodytypes.delete', 'bodytypes.update', 'bodytypes.view',
  'brands.create', 'brands.delete', 'brands.update', 'brands.view',
  'carmodels.create', 'carmodels.delete', 'carmodels.update', 'carmodels.view',
  'cities.create', 'cities.delete', 'cities.update', 'cities.view',
  'colors.create', 'colors.delete', 'colors.update', 'colors.view',
  'countries.create', 'countries.delete', 'countries.update', 'countries.view',
  'faqs.create', 'faqs.delete', 'faqs.update', 'faqs.view',
  'feature-categories.create', 'feature-categories.delete', 'feature-categories.update', 'feature-categories.view',
  'features.create', 'features.delete', 'features.update', 'features.view',
  'images.create', 'images.delete', 'images.update', 'images.view',
  'leads.moderate', 'leads.view',
  'lenders.create', 'lenders.delete', 'lenders.update', 'lenders.view',
  'offers.create', 'offers.delete', 'offers.update', 'offers.view',
  'permissions.create', 'permissions.delete', 'permissions.view',
  'powertrainselectric.create', 'powertrainselectric.delete', 'powertrainselectric.update', 'powertrainselectric.view',
  'powertrainsice.create', 'powertrainsice.delete', 'powertrainsice.update', 'powertrainsice.view',
  'reviews.delete', 'reviews.moderate', 'reviews.view',
  'roles.create', 'roles.delete', 'roles.update', 'roles.view',
  'search-logs.delete', 'search-logs.view',
  'seo-meta.create', 'seo-meta.delete', 'seo-meta.update', 'seo-meta.view',
  'site.settings.update', 'site.settings.view',
  'states.create', 'states.delete', 'states.update', 'states.view',
  'story-groups.create', 'story-groups.delete', 'story-groups.update', 'story-groups.view',
  'story-items.create', 'story-items.delete', 'story-items.update', 'story-items.view',
  'testimonials.create', 'testimonials.delete', 'testimonials.update', 'testimonials.view',
  'users.delete', 'users.update', 'users.view',
  'variant-features.update', 'variant-features.view',
  'variants.create', 'variants.delete', 'variants.update', 'variants.view',
] as const;

// module/action are just display/grouping columns (see permission.service.ts's
// listPermissions grouping by `module`) — split on the LAST dot so keys with
// more than one dot (e.g. "ai.articles.delete", "site.settings.update")
// still get a sensible action instead of swallowing it into the module.
function splitPermissionKey(key: string): { module: string; action: string } {
  const lastDot = key.lastIndexOf('.');
  return { module: key.slice(0, lastDot), action: key.slice(lastDot + 1) };
}

async function main() {
  console.log('Seeding site settings...');

  const existingSiteSetting = await prisma.siteSetting.findFirst();

  if (existingSiteSetting) {
    console.log(`Site settings already exist (id: ${existingSiteSetting.id}). Skipping.`);
  } else {
    // Permissions below don't depend on an AdminUser existing — only this
    // site_settings row does (it needs a createdBy/updatedBy). So a
    // missing admin should skip just this step, not abort the whole
    // script (a hard process.exit(1) here used to skip permission
    // seeding too, silently, whenever this ran before seed.ts).
    const anyAdmin = await prisma.adminUser.findFirst({ orderBy: { id: 'asc' } });

    if (!anyAdmin) {
      console.warn('No AdminUser found — skipping site settings for now. Run seed.ts, then re-run this script to create it.');
    } else {
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
  }

  console.log(`Seeding ${PERMISSION_KEYS.length} permissions...`);

  const result = await prisma.permission.createMany({
    data: PERMISSION_KEYS.map((permissionKey) => ({
      permissionKey,
      ...splitPermissionKey(permissionKey),
    })),
    skipDuplicates: true,
  });

  console.log(`Inserted ${result.count} new permission(s) (existing ones skipped).`);
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
