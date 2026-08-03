// components/leads/LeadFormControls.tsx
//
// Shared input/select/label styling for the multi-step "hard lead"
// wizards (Insurance, Loan, ...) — glassy translucent fields designed
// to sit on top of the wizard's faded background car image. Extracted
// from InsuranceLeadModal once a second wizard needed the same look.

export const inputClass =
  "w-full rounded-xl border border-border bg-white/60 px-3 py-2.5 text-[13px] text-ink outline-none backdrop-blur-sm transition-colors focus:border-brand focus:bg-white";
export const selectClass =
  "w-full cursor-pointer rounded-xl border border-border bg-white/60 px-3 py-2.5 text-[13px] text-ink outline-none backdrop-blur-sm transition-colors focus:border-brand focus:bg-white disabled:cursor-not-allowed disabled:opacity-50";

export const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <span className="mb-1 block text-[11.5px] font-bold uppercase tracking-wide text-muted">
    {children}
    {required && <span className="text-brand"> *</span>}
  </span>
);
