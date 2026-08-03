// features/lenders/lender.types.ts
//
// Mirrors admin-backend's public /lenders/options — lightweight,
// unpaginated, active lenders only. Used by the Loan Lead form's
// "Preferred Lender" dropdown.

export interface LenderOption {
  id: number;
  name: string;
  logoUrl: string | null;
  minInterestRate: string | null;
  maxInterestRate: string | null;
  maxLoanAmount: string | null;
  maxTenureYears: number | null;
}
