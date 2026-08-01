// src/modules/buyLeads/priceDropAlerts/priceDropAlertLead.types.ts

export interface PriceDropAlertLeadBrandSummary {
  id: number;
  name: string;
}

export interface PriceDropAlertLeadModelSummary {
  id: number;
  name: string;
  priceMin: string | null;
}

// PriceDropAlertLead has no `status` field (unlike BuyNewCarLead /
// InsuranceLead) — it's a toggleable subscription (isActive), not a
// funnel-stage lead, so it's tracked separately rather than reusing
// BUY_NEW_CAR_LEAD_STATUSES.
export interface PriceDropAlertLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (OTP-verified, no account).
  userId: number | null;
  mobile: string;
  email: string | null;
  priceAtSubscription: string | null;
  brandId: number | null;
  brand: PriceDropAlertLeadBrandSummary | null;
  modelId: number | null;
  model: PriceDropAlertLeadModelSummary | null;
  alertType: string | null;
  isActive: boolean;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceDropAlertLeadDetailRecord extends PriceDropAlertLeadRecord {
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}

export interface PriceDropAlertLeadStats {
  today: number;
  thisMonth: number;
  active: number;
}
