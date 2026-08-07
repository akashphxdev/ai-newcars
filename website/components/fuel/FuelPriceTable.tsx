// components/fuel/FuelPriceTable.tsx

import { FUEL_LABELS, formatFuelPrice, formatFuelChange } from "@/lib/fuel";
import type { FuelName, FuelPoint } from "@/features/fuel/fuel.types";

const ORDER: FuelName[] = ["petrol", "diesel", "cng"];

export default function FuelPriceTable({
  prices,
}: {
  prices: Partial<Record<FuelName, FuelPoint>>;
}) {
  const rows = ORDER.filter((f) => prices[f]);
  if (rows.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {rows.map((fuel) => {
        const p = prices[fuel]!;
        const change = formatFuelChange(p.change);
        return (
          <div key={fuel} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
              {FUEL_LABELS[fuel]}
            </p>
            <p className="mt-1.5 text-2xl font-bold text-ink tabular-nums">
              {formatFuelPrice(p.price)}
              <span className="ml-1 text-[12px] font-semibold text-muted">/L</span>
            </p>
            <p className={`mt-1 text-[12px] font-semibold tabular-nums ${change.className}`}>
              {change.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
