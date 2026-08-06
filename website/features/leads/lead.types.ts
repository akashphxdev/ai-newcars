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

export interface SubmitLaunchNotifyLeadInput {
  mobile: string;
  email?: string;
  otp?: string;
  brandId?: number;
  modelId: number;
}

export type InsuranceType = "new" | "renew" | "expired";

export interface SubmitInsuranceLeadInput {
  name?: string;
  mobile: string;
  email?: string;
  otp?: string;
  registrationNumber?: string;
  brandId?: number;
  modelId?: number;
  variantId?: number;
  registrationYear?: number;
  registrationStateId?: number;
  cityId?: number;
  insuranceType: InsuranceType;
  currentInsuranceCompany?: string;
  policyExpiryDate?: string;
  hadClaim?: boolean;
}

export interface SubmitLoanLeadInput {
  name?: string;
  mobile: string;
  email?: string;
  otp?: string;
  brandId?: number;
  modelId?: number;
  variantId?: number;
  lenderId?: number;
  loanAmount?: number;
  tenureYears?: number;
  interestRate?: number;
  monthlyIncome?: number;
}

export interface SubmitLeadResult {
  id: number;
  duplicate: boolean;
}

// Matches admin-backend's SOFT_LEAD_CALCULATOR_TYPES
// (modules/buyLeads/softLeads/softLead.validation.ts) — extend both
// whenever a new calculator ships.
export type SoftLeadCalculatorType = "emi" | "mileage" | "down_payment" | "affordability" | "ev_charging" | "fuel_comparison";

export interface SubmitSoftLeadInput {
  mobile: string;
  brandId?: number;
  modelId?: number;
  calculatorType: SoftLeadCalculatorType;
  inputSummary?: string;
}
