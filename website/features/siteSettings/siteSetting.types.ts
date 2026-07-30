// features/siteSettings/siteSetting.types.ts
//
// Mirrors admin-backend's PublicSiteSettingRecord (modules/public/siteSetting).

export interface PublicSiteSetting {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  supportEmail: string | null;
  contactEmail: string | null;
  contactNumber: string | null;
  whatsappNumber: string | null;
  address: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
}
