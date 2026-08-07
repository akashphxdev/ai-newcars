// src/modules/buyLeads/launchNotify/launchNotifyLead.types.ts

export interface LaunchNotifyLeadBrandSummary {
  id: number;
  name: string;
}

export interface LaunchNotifyLeadModelSummary {
  id: number;
  name: string;
  launchStatus: string;
  expectedLaunchDate: Date | null;
}

// Toggleable subscription (isActive), not a funnel-stage lead — same
// reasoning as PriceDropAlertLeadRecord.
export interface LaunchNotifyLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (OTP-verified, no account).
  userId: number | null;
  mobile: string;
  email: string | null;
  expectedLaunchDateAtSubscription: Date | null;
  brandId: number | null;
  brand: LaunchNotifyLeadBrandSummary | null;
  modelId: number | null;
  model: LaunchNotifyLeadModelSummary | null;
  isActive: boolean;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaunchNotifyLeadDetailRecord extends LaunchNotifyLeadRecord {
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}

export interface LaunchNotifyLeadStats {
  today: number;
  thisMonth: number;
  active: number;
}
