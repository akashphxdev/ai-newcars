// src/modules/buyLeads/loanLeads/loanLead.types.ts

export interface LoanLeadBrandSummary {
  id: number;
  name: string;
}

export interface LoanLeadModelSummary {
  id: number;
  name: string;
}

export interface LoanLeadVariantSummary {
  id: number;
  variantName: string;
}

export interface LoanLeadLenderSummary {
  id: number;
  name: string;
  logoUrl: string | null;
}

export interface LoanLeadRecord {
  id: number;
  // Set only when the lead was submitted by a logged-in account — null
  // means it came from a guest (OTP-verified, no account).
  userId: number | null;
  name: string | null;
  mobile: string;
  brandId: number | null;
  brand: LoanLeadBrandSummary | null;
  modelId: number | null;
  model: LoanLeadModelSummary | null;
  variantId: number | null;
  variant: LoanLeadVariantSummary | null;
  lenderId: number | null;
  lender: LoanLeadLenderSummary | null;
  loanAmount: string | null;
  tenureYears: number | null;
  interestRate: string | null;
  monthlyIncome: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tracking/attribution fields only ride along on the single-record
// detail response — never on the list (Rule: fetch only what's needed).
export interface LoanLeadDetailRecord extends LoanLeadRecord {
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}

export interface LoanLeadStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  converted: number;
}
