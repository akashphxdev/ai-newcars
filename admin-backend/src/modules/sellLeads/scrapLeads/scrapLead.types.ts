// src/modules/sellLeads/scrapLeads/scrapLead.types.ts

export interface ScrapLeadBrandSummary {
  id: number;
  name: string;
}

export interface ScrapLeadModelSummary {
  id: number;
  name: string;
}

export interface ScrapLeadCitySummary {
  id: number;
  name: string;
}

export interface ScrapLeadStateSummary {
  id: number;
  name: string;
}

export interface ScrapLeadRecord {
  id: number;
  name: string | null;
  mobile: string;
  brandId: number | null;
  brand: ScrapLeadBrandSummary | null;
  modelId: number | null;
  model: ScrapLeadModelSummary | null;
  // Whatever the owner typed when their car was not in the catalogue.
  brandName: string | null;
  modelName: string | null;
  registrationNumber: string | null;
  registrationYear: number | null;
  cityId: number | null;
  city: ScrapLeadCitySummary | null;
  vehicleCondition: string | null;
  quotedPrice: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScrapLeadDetailRecord extends ScrapLeadRecord {
  email: string | null;
  registrationStateId: number | null;
  registrationState: ScrapLeadStateSummary | null;
  fuelType: string | null;
  hasOriginalRc: boolean | null;
  isHypothecated: boolean | null;
  hasPendingChallan: boolean | null;
  wantsCertificateOfDeposit: boolean | null;
  preferredPickupDate: Date | null;
  notes: string | null;
  leadChannel: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  deviceType: string | null;
  ipAddress: string | null;
}
