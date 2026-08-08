// components/fuel/FuelPriceContext.tsx
//
// A price on its own tells a visitor nothing — ₹112.02 is only meaningful
// against what the rest of the state and the country pay, and against
// where this city has been for the past month. That comparison is also
// the only text on a city page that is genuinely unique to it.

import type { FuelCityContext, FuelName, FuelPoint } from "@/features/fuel/fuel.types";
import { FUEL_LABELS, formatFuelPrice } from "@/lib/fuel";

const UNIT: Record<FuelName, string> = { petrol: "litre", diesel: "litre", cng: "kg" };

// "CNG" is an initialism, so it keeps its case mid-sentence.
const INLINE: Record<FuelName, string> = { petrol: "petrol", diesel: "diesel", cng: "CNG" };

function delta(price?: string, against?: string) {
  const a = Number(price);
  const b = Number(against);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  const diff = a - b;
  if (Math.abs(diff) < 0.05) return { text: "about the same as", amount: null };
  return {
    text: diff > 0 ? "higher than" : "lower than",
    amount: `₹${Math.abs(diff).toFixed(2)}`,
  };
}

function Row({
  fuel,
  point,
  benchmark,
  cityName,
  stateName,
}: {
  fuel: FuelName;
  point: FuelPoint;
  benchmark?: FuelCityContext[FuelName];
  cityName: string;
  stateName: string;
}) {
  const vsState = delta(point.price, benchmark?.stateAvg);
  const vsIndia = delta(point.price, benchmark?.nationalAvg);
  const hasRange = benchmark?.low30 && benchmark?.high30 && benchmark.low30 !== benchmark.high30;

  return (
    <div className="rounded-[8px] border border-border bg-surface p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand">{FUEL_LABELS[fuel]}</p>
      <p className="mt-2 text-[22px] font-extrabold text-ink tabular-nums">
        {formatFuelPrice(point.price)}
        <span className="ml-1 text-[11px] font-semibold text-muted">/{UNIT[fuel]}</span>
      </p>

      <p className="mt-3 text-[12.5px] leading-6 text-muted">
        {vsState && (
          <>
            That is{" "}
            <strong className="font-bold text-ink">
              {vsState.amount ? `${vsState.amount} ${vsState.text}` : vsState.text}
            </strong>{" "}
            the {stateName} average of {formatFuelPrice(benchmark?.stateAvg)}
            {vsIndia && (
              <>
                , and {vsIndia.amount ? `${vsIndia.amount} ${vsIndia.text}` : vsIndia.text} the national
                average of {formatFuelPrice(benchmark?.nationalAvg)}
              </>
            )}
            .{" "}
          </>
        )}
        {hasRange && (
          <>
            Over the last 30 days {INLINE[fuel]} in {cityName} ranged between{" "}
            <strong className="font-bold text-ink">{formatFuelPrice(benchmark!.low30)}</strong> and{" "}
            <strong className="font-bold text-ink">{formatFuelPrice(benchmark!.high30)}</strong>.
          </>
        )}
      </p>
    </div>
  );
}

export default function FuelPriceContext({
  cityName,
  stateName,
  prices,
  context,
}: {
  cityName: string;
  stateName: string;
  prices: Partial<Record<FuelName, FuelPoint>>;
  context: FuelCityContext;
}) {
  const rows = (["petrol", "diesel", "cng"] as FuelName[]).flatMap((fuel) => {
    const point = prices[fuel];
    const benchmark = context[fuel];
    return point && benchmark ? [{ fuel, point, benchmark }] : [];
  });

  if (rows.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
      <h2 className="font-head text-[24px] font-extrabold leading-tight text-ink sm:text-[30px]">
        How {cityName} compares
      </h2>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">
        Fuel is taxed by the state, so what {cityName} pays is best read against {stateName} and
        against India as a whole.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {rows.map((row) => (
          <Row
            key={row.fuel}
            fuel={row.fuel}
            point={row.point}
            benchmark={row.benchmark}
            cityName={cityName}
            stateName={stateName}
          />
        ))}
      </div>
    </section>
  );
}
