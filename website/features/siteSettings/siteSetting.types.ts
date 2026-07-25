// features/siteSettings/siteSetting.types.ts
//
// Mirrors admin-backend's PublicSiteSettingRecord (modules/public/siteSetting).

export interface PublicSiteSetting {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}
