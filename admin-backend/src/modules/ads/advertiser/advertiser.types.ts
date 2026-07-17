// src/modules/ads/advertiser/advertiser.types.ts

export interface AdvertiserAdminSummary {
  id: number;
  name: string;
}

export interface AdvertiserListItem {
  id: number;
  name: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  isActive: boolean;
  campaignCount: number;
  createdBy: number | null;
  createdByAdmin: AdvertiserAdminSummary | null;
  createdAt: Date;
  updatedBy: number | null;
  updatedByAdmin: AdvertiserAdminSummary | null;
  updatedAt: Date;
}
