// components/calculators/CalculatorFormControls.tsx
//
// Shared input/select styling + Label, same pattern used across every
// Tools calculator — extracted here now that a 3rd+ calculator needs it.

export const selectClass =
  "h-11 w-full cursor-pointer rounded-md border border-border bg-surface px-3 text-[13px] font-medium text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-subtle focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:bg-page disabled:opacity-55";

export const inputClass =
  "h-11 w-full rounded-md border border-border bg-surface px-3 text-[13px] font-semibold tabular-nums text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-subtle focus:border-brand focus:ring-2 focus:ring-brand/10";

export const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1.5 block text-[12px] font-semibold text-ink">{children}</span>
);
