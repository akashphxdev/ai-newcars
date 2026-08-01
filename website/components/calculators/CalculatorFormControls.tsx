// components/calculators/CalculatorFormControls.tsx
//
// Shared input/select styling + Label, same pattern used across every
// Tools calculator — extracted here now that a 3rd+ calculator needs it.

export const selectClass =
  "w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand disabled:cursor-not-allowed disabled:opacity-50";

export const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-ink outline-none transition-colors focus:border-brand";

export const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1.5 block text-[12px] font-bold text-ink">{children}</span>
);
