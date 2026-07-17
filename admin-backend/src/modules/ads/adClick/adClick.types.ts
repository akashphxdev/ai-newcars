// src/modules/ads/adClick/adClick.types.ts

export interface AdClickCampaignSummary {
  id: number;
  name: string;
}

export interface AdClickPlacementSummary {
  id: number;
  name: string;
}

export interface AdClickUserSummary {
  id: number;
  name: string;
}

export interface AdClickRecord {
  id: number;
  campaignId: number;
  campaign: AdClickCampaignSummary;
  placementId: number | null;
  placement: AdClickPlacementSummary | null;
  impressionId: number | null;
  userId: number | null;
  user: AdClickUserSummary | null;
  pageUrl: string | null;
  deviceType: string | null;
  ipAddress: string | null;
  sessionId: string | null;
  referrerUrl: string | null;
  userAgent: string | null;
  clickedAt: Date;
}
