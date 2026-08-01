import SectionHeader from "@/components/common/SectionHeader";

const STEPS = [
  {
    label: "1",
    title: "Cost per km",
    desc: "Fuel Price ÷ Mileage — e.g. ₹104 per litre ÷ 16.5 kmpl = ₹6.30 spent for every km you drive.",
  },
  {
    label: "2",
    title: "Daily / Monthly Cost",
    desc: "Cost per km × your driving distance — monthly distance ÷ 30 for the daily figure, or as-is for monthly.",
  },
  {
    label: "3",
    title: "Yearly Cost",
    desc: "Monthly Cost × 12 — a simple projection assuming your monthly driving stays roughly the same all year.",
  },
];

// Static, hand-written explainer — same pattern as
// components/calculators/EmiFormulaExplainer.tsx. Deliberately only
// shows the one real formula this calculator uses — no invented
// maintenance/insurance/AC/traffic multipliers, since none of those
// have a real data source in this app.
export default function MileageFormulaExplainer() {
  return (
    <div className="mt-10">
      <SectionHeader
        eyebrow="How It Works"
        title="How Is Mileage & Running Cost Calculated?"
        subtitle="Your mileage comes straight from the car's own spec sheet. Running cost is one simple formula from that mileage and the fuel price you enter."
      />

      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col items-center gap-2 rounded-xl bg-page px-6 py-6 text-center sm:py-8">
          <p className="text-[11px] font-bold uppercase tracking-wide text-faint">The Formula</p>
          <p className="font-head text-[20px] font-extrabold text-ink sm:text-[24px]">
            Cost per km = Fuel Price ÷ Mileage
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.label} className="rounded-xl border border-border-soft p-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-[14px] font-extrabold text-brand">
                {step.label}
              </span>
              <p className="mt-3 text-[13.5px] font-bold text-ink">{step.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{step.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[12.5px] leading-relaxed text-muted">
          The mileage figure itself is pre-filled from the selected variant&apos;s own real-world rated mileage (or
          range, for EVs) — you can edit it if your actual observed mileage differs. Nothing else (traffic, AC usage,
          maintenance) is factored into the cost shown, since those don&apos;t have a reliable, real figure to
          calculate from — only your own driving will tell you their actual effect.
        </p>
      </div>
    </div>
  );
}
