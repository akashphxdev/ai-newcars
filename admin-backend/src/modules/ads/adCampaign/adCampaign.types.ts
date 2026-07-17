// src/modules/ads/adCampaign/adCampaign.types.ts

export interface AdCampaignAdminSummary {
  id: number;
  name: string;
}

export interface AdCampaignPlacementSummary {
  id: number;
  name: string;
  slug: string;
}

export interface AdCampaignAdvertiserSummary {
  id: number;
  name: string;
}

export interface AdCampaignRecord {
  id: number;
  placementId: number;
  placement: AdCampaignPlacementSummary;
  advertiserId: number | null;
  advertiser: AdCampaignAdvertiserSummary | null;
  name: string;
  creativeImageUrl: string;
  targetUrl: string;
  priority: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  createdBy: number | null;
  createdByAdmin: AdCampaignAdminSummary | null;
  createdAt: Date;
  updatedBy: number | null;
  updatedByAdmin: AdCampaignAdminSummary | null;
  updatedAt: Date;
}
