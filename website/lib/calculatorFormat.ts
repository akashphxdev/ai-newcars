// lib/calculatorFormat.ts
//
// Shared by every Tools calculator page — was duplicated verbatim
// across EmiCalculatorClient/MileageCalculatorClient before this;
// extracted here now that a 3rd+ calculator needs the same formatting.

export function formatRupee(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatLakh(n: number): string {
  return `₹${(n / 100000).toFixed(2)}L`;
}
