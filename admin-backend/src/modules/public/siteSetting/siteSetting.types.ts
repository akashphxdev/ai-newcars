// src/modules/public/siteSetting/siteSetting.types.ts
//
// Public-safe shape — only what the website needs to gate the site
// behind a maintenance page. Contact/social fields on SiteSetting are
// intentionally left out here.

export interface PublicSiteSettingRecord {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}
