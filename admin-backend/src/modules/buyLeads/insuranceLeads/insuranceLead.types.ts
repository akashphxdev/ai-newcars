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

export interface InsuranceLeadRecord {
  id: number;
  name: string | null;
  mobile: string;
  registrationNumber: string | null;
  brandId: number | null;
  brand: InsuranceLeadBrandSummary | null;
  modelId: number | null;
  model: InsuranceLeadModelSummary | null;
  cityId: number | null;
  city: InsuranceLeadCitySummary | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsuranceLeadDetailRecord extends InsuranceLeadRecord {
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}
