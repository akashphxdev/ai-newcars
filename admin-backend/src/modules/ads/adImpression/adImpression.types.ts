// src/modules/ads/adImpression/adImpression.types.ts

export interface AdImpressionCampaignSummary {
  id: number;
  name: string;
}

export interface AdImpressionPlacementSummary {
  id: number;
  name: string;
}

export interface AdImpressionUserSummary {
  id: number;
  name: string;
}

export interface AdImpressionRecord {
  id: number;
  campaignId: number;
  campaign: AdImpressionCampaignSummary;
  placementId: number | null;
  placement: AdImpressionPlacementSummary | null;
  userId: number | null;
  user: AdImpressionUserSummary | null;
  pageUrl: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  referrerUrl: string | null;
  userAgent: string | null;
  viewedAt: Date;
}
