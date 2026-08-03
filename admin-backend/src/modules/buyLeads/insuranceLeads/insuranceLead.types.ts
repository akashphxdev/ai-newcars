// src/modules/buyLeads/insuranceLeads/insuranceLead.types.ts

export interface InsuranceLeadBrandSummary {
  id: number;
  name: string;
}

export interface InsuranceLeadModelSummary {
  id: number;
  name: string;
}

export interface InsuranceLeadCitySummary {
  id: number;
  name: string;
}

export interface InsuranceLeadVariantSummary {
  id: number;
  variantName: string;
}

export interface InsuranceLeadStateSummary {
  id: number;
  name: string;
}

export interface InsuranceLeadRecord {
  id: number;
  name: string | null;
  mobile: string;
  registrationNumber: string | null;
  brandId: number | null;
  brand: InsuranceLeadBrandSummary | null;
  modelId: number | null;
  model: InsuranceLeadModelSummary | null;
  variantId: number | null;
  variant: InsuranceLeadVariantSummary | null;
  registrationYear: number | null;
  registrationStateId: number | null;
  registrationState: InsuranceLeadStateSummary | null;
  cityId: number | null;
  city: InsuranceLeadCitySummary | null;
  insuranceType: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceLeadDetailRecord extends InsuranceLeadRecord {
  currentInsuranceCompany: string | null;
  policyExpiryDate: Date | null;
  hadClaim: boolean | null;
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}
