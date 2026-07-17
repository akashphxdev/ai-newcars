// src/modules/ads/adPlacement/adPlacement.types.ts

export interface AdPlacementAdminSummary {
  id: number;
  name: string;
}

export interface AdPlacementRecord {
  id: number;
  name: string;
  slug: string;
  // See PAGE_TYPE_CODES/AD_TYPE_CODES in adPlacement.validation.ts.
  pageType: number;
  adType: number;
  dimensions: string;
  isActive: boolean;
  campaignCount: number;
  createdBy: number | null;
  createdByAdmin: AdPlacementAdminSummary | null;
  createdAt: Date;
  updatedBy: number | null;
  updatedByAdmin: AdPlacementAdminSummary | null;
  updatedAt: Date;
}
