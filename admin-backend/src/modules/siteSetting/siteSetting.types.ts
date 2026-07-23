// src/modules/siteSetting/siteSetting.types.ts

export interface SiteSettingResponse {
  id: number;
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
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date | null;
}