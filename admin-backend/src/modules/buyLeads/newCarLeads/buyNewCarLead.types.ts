// src/modules/buyLeads/newCarLeads/buyNewCarLead.types.ts

export interface BuyNewCarLeadBrandSummary {
  id: number;
  name: string;
}

export interface BuyNewCarLeadModelSummary {
  id: number;
  name: string;
}

export interface BuyNewCarLeadVariantSummary {
  id: number;
  variantName: string;
}

export interface BuyNewCarLeadCitySummary {
  id: number;
  name: string;
}

export interface BuyNewCarLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (OTP-verified, no account).
  userId: number | null;
  name: string | null;
  mobile: string;
  email: string | null;
  brandId: number | null;
  brand: BuyNewCarLeadBrandSummary | null;
  modelId: number | null;
  model: BuyNewCarLeadModelSummary | null;
  variantId: number | null;
  variant: BuyNewCarLeadVariantSummary | null;
  cityId: number | null;
  city: BuyNewCarLeadCitySummary | null;
  interestType: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tracking/attribution fields only ride along on the single-record
// detail response — never on the list (Rule: fetch only what's needed).
export interface BuyNewCarLeadDetailRecord extends BuyNewCarLeadRecord {
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}

export interface BuyNewCarLeadStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  converted: number;
}
