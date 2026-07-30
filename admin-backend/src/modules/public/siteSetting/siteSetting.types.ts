// src/modules/public/siteSetting/siteSetting.types.ts
//
// Public-safe shape — everything the website's footer/maintenance page
// need. Audit fields (createdBy/updatedBy/timestamps) stay admin-only.

export interface PublicSiteSettingRecord {
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
