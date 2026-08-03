// components/leads/StepIndicator.tsx
//
// Numbered circle + connecting line stepper — shared by every
// multi-step lead wizard (Insurance, Loan, ...). Extracted from
// InsuranceLeadModal once a second wizard needed the same header.
import { CheckIcon } from "@/components/common/icons";

export interface WizardStepDef {
  key: string;
  label: string;
}

export default function StepIndicator({ steps, currentIndex }: { steps: WizardStepDef[]; currentIndex: number }) {
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <div key={s.key} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span
              className={`flex size-6.5 items-center justify-center rounded-full text-[11.5px] font-bold ${
                i <= currentIndex ? "bg-brand text-white" : "border-2 border-border bg-white text-muted"
              }`}
            >
              {i < currentIndex ? <CheckIcon className="size-3.5" /> : i + 1}
            </span>
            <span className={`hidden text-[11px] font-bold whitespace-nowrap sm:block ${i <= currentIndex ? "text-brand" : "text-muted"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <span className={`mx-2 h-0.5 flex-1 rounded-full ${i < currentIndex ? "bg-brand" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}
