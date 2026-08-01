// features/leads/lead.types.ts
//
// Mirrors admin-backend's modules/public/leads/* validation shapes.

export interface SendLeadOtpInput {
  mobile: string;
  email: string;
  name?: string;
}

export interface SendLeadOtpResult {
  maskedEmail: string;
  message: string;
}

export type BuyNewCarLeadInterestType = "enquiry" | "offer_check";

export interface SubmitBuyNewCarLeadInput {
  name?: string;
  mobile: string;
  email?: string;
  otp?: string;
  brandId?: number;
  modelId?: number;
  variantId?: number;
  cityId?: number;
  interestType: BuyNewCarLeadInterestType;
}

export interface SubmitPriceDropAlertLeadInput {
  mobile: string;
  email?: string;
  otp?: string;
  brandId?: number;
  modelId: number;
}

export interface SubmitLeadResult {
  id: number;
  duplicate: boolean;
}
