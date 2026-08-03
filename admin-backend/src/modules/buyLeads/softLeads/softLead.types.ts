// src/modules/buyLeads/softLeads/softLead.types.ts

export interface SoftLeadBrandSummary {
  id: number;
  name: string;
}

export interface SoftLeadModelSummary {
  id: number;
  name: string;
}

export interface SoftLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (no OTP for soft leads, unlike the hard
  // lead tables — see softLead.public.service.ts).
  userId: number | null;
  mobile: string | null;
  brandId: number | null;
  brand: SoftLeadBrandSummary | null;
  modelId: number | null;
  model: SoftLeadModelSummary | null;
  calculatorType: string | null;
  inputSummary: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tracking/attribution fields only ride along on the single-record
// detail response — never on the list (Rule: fetch only what's needed).
export interface SoftLeadDetailRecord extends SoftLeadRecord {
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}

export interface SoftLeadStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  converted: number;
}
