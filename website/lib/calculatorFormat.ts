// lib/calculatorFormat.ts
//
// Shared by every Tools calculator page — was duplicated verbatim
// across EmiCalculatorClient/MileageCalculatorClient before this;
// extracted here now that a 3rd+ calculator needs the same formatting.

// Loan maths produces fractions, and a down payment of ₹2,06,865.96 reads
// as a mistake because nobody quotes a car price to two decimals. But the
// same helper renders per-km running costs, where rounding ₹4.72 to ₹5
// would throw away the entire point of the figure. Paise survive only
// below ₹100, which is where they still carry meaning.
const PAISE_MATTER_BELOW = 100;

export function formatRupee(n: number): string {
  const decimals = Math.abs(n) < PAISE_MATTER_BELOW ? 2 : 0;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatLakh(n: number): string {
  return `₹${(n / 100000).toFixed(2)}L`;
}
