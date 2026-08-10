// components/calculators/FuelBreakEvenVerdict.tsx
//
// The question this page is really being asked is not "what does each
// fuel cost per km" — it is "is the CNG worth the extra money". That is a
// break-even, and it is the one number the table of running costs cannot
// show, because it needs the purchase prices too.
//
// Nothing here is advice. It states the distance at which the cheaper
// fuel has repaid its premium, and how long that takes at the driving the
// visitor entered.

"use client";

import { formatRupee } from "@/lib/calculatorFormat";

export interface BreakEvenOption {
  label: string;
  price: number;
  costPerKm: number;
}

export default function FuelBreakEvenVerdict({
  options,
  monthlyDistanceKm,
}: {
  options: BreakEvenOption[];
  monthlyDistanceKm: number;
}) {
  const usable = options.filter((o) => o.price > 0 && o.costPerKm > 0);
  if (usable.length < 2) return null;

  const cheapestToBuy = usable.reduce((a, b) => (b.price < a.price ? b : a));
  const cheapestToRun = usable.reduce((a, b) => (b.costPerKm < a.costPerKm ? b : a));

  if (cheapestToBuy.label === cheapestToRun.label) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-[13.5px] font-bold text-ink">Which one pays off</h3>
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          The <span className="font-semibold text-ink">{cheapestToBuy.label}</span> is both the
          cheapest to buy and the cheapest to run, so there is no trade-off to weigh here.
        </p>
      </div>
    );
  }

  const extraUpfront = cheapestToRun.price - cheapestToBuy.price;
  const savingPerKm = cheapestToBuy.costPerKm - cheapestToRun.costPerKm;

  // The cheaper-to-run car can also be the cheaper car outright once the
  // variants differ in trim rather than fuel; then there is nothing to
  // recover and the break-even is meaningless.
  if (extraUpfront <= 0 || savingPerKm <= 0) return null;

  const breakEvenKm = Math.round(extraUpfront / savingPerKm);
  const months = monthlyDistanceKm > 0 ? breakEvenKm / monthlyDistanceKm : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="text-[13.5px] font-bold text-ink">Which one pays off</h3>

      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
        The <span className="font-semibold text-ink">{cheapestToRun.label}</span> costs{" "}
        <span className="font-semibold text-ink">{formatRupee(extraUpfront)}</span> more to buy than
        the {cheapestToBuy.label}, and saves{" "}
        <span className="font-semibold text-ink">{formatRupee(savingPerKm)}</span> per kilometre.
      </p>

      <div className="mt-3.5 rounded-xl bg-page p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          Breaks even at
        </p>
        <p className="mt-1 font-head text-[22px] font-extrabold leading-none text-ink tabular-nums">
          {breakEvenKm.toLocaleString("en-IN")} km
        </p>
        {months > 0 && (
          <p className="mt-1.5 text-[12px] text-muted">
            About{" "}
            <span className="font-semibold text-ink">
              {months < 12
                ? `${Math.round(months)} months`
                : `${(months / 12).toFixed(1)} years`}
            </span>{" "}
            at {monthlyDistanceKm.toLocaleString("en-IN")} km a month. Drive less than that and the{" "}
            {cheapestToBuy.label} stays the cheaper car overall.
          </p>
        )}
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-subtle">
        Compares the cheapest variant of each fuel, so trim differences between them are included
        in the price gap. Excludes servicing, which differs by fuel — CNG and diesel typically cost
        more to maintain.
      </p>
    </div>
  );
}
