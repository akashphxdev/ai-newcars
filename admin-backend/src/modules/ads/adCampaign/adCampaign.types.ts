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
  creativeType: string;
  // Both null on a script campaign, which has no creative of ours and no
  // click of ours to send anywhere.
  creativeImageUrl: string | null;
  targetUrl: string | null;
  scriptSrc: string | null;
  scriptAttrs: Record<string, string> | null;
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
