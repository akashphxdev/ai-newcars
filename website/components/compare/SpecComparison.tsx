import { CheckIcon, MinusIcon } from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import type { CompareCarResult } from "@/features/compare/compare.types";

// Index of the best value among 2-4 cars for a given numeric row, or
// null when there's a tie / fewer than 2 comparable values — null means
// "don't highlight anything" (Row/FeatureRow render every value in the
// neutral ink color in that case).
function bestIndex(values: (number | null)[], higherIsBetter = true): number | null {
  const known = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v != null);
  if (known.length < 2) return null;

  const best = higherIsBetter ? Math.max(...known.map((x) => x.v)) : Math.min(...known.map((x) => x.v));
  const winners = known.filter((x) => x.v === best);
  return winners.length === 1 ? winners[0].i : null;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="overflow-hidden rounded-2xl border border-border bg-surface">
    <h2 className="border-b border-border-soft px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-muted sm:px-6">{title}</h2>
    <div>{children}</div>
  </div>
);

const Row = ({ label, values, better }: { label: string; values: React.ReactNode[]; better?: number | null }) => (
  <div
    className="grid items-center gap-3 border-b border-border-soft px-4 py-3.5 last:border-b-0 sm:px-6"
    style={{ gridTemplateColumns: `120px repeat(${values.length}, 1fr)` }}
  >
    <div className="whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
    {values.map((v, i) => (
      <div key={i} className={`truncate text-center text-[13.5px] font-bold ${i === better ? "text-brand" : "text-ink"}`}>
        {v}
      </div>
    ))}
  </div>
);

const FeatureRow = ({ label, values }: { label: string; values: boolean[] }) => (
  <div
    className="grid items-center gap-3 border-b border-border-soft px-4 py-3 last:border-b-0 sm:px-6"
    style={{ gridTemplateColumns: `120px repeat(${values.length}, 1fr)` }}
  >
    <div className="whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
    {values.map((v, i) => (
      <div key={i} className="flex justify-center">
        {v ? <CheckIcon className="size-4 text-ev" /> : <MinusIcon className="size-4 text-muted" />}
      </div>
    ))}
  </div>
);

const NA = "N/A";
const num = (v: string | number | null | undefined) => (v == null ? null : Number(v));

export default function SpecComparison({ cars }: { cars: CompareCarResult[] }) {
  const specsList = cars.map((c) => c.specs);
  const prices = cars.map((c) => num(c.priceMin));

  return (
    <div className="flex flex-col gap-6">
      <Section title="Overview">
        <Row label="Starting Price" values={cars.map((c) => formatSinglePrice(c.priceMin))} better={bestIndex(prices, false)} />
        <Row label="Body Type" values={cars.map((c) => c.bodyType?.name ?? NA)} />
        <Row label="Seating Capacity" values={specsList.map((s) => s?.seatingCapacity ?? NA)} />
        <Row label="Transmission" values={specsList.map((s) => s?.transmission ?? NA)} />
        <Row label="Fuel Type" values={cars.map((c, i) => (c.isElectric ? "Electric" : specsList[i]?.fuelType ?? NA))} />
      </Section>

      <Section title="Performance">
        <Row
          label="Power"
          values={specsList.map((s) => (s?.powerPs ? `${s.powerPs} PS` : NA))}
          better={bestIndex(specsList.map((s) => s?.powerPs ?? null))}
        />
        <Row
          label="Torque"
          values={specsList.map((s) => (s?.torqueNm ? `${s.torqueNm} Nm` : NA))}
          better={bestIndex(specsList.map((s) => s?.torqueNm ?? null))}
        />
        <Row
          label="Top Speed"
          values={specsList.map((s) => (s?.topSpeedKmph ? `${s.topSpeedKmph} km/h` : NA))}
          better={bestIndex(specsList.map((s) => s?.topSpeedKmph ?? null))}
        />
        <Row
          label="Mileage"
          values={specsList.map((s) => (s?.mileage ? `${s.mileage} km/l` : NA))}
          better={bestIndex(specsList.map((s) => num(s?.mileage)))}
        />
        <Row
          label="Battery Capacity"
          values={specsList.map((s) => (s?.batteryCapacity ? `${s.batteryCapacity} kWh` : NA))}
          better={bestIndex(specsList.map((s) => num(s?.batteryCapacity)))}
        />
        <Row label="Range" values={specsList.map((s) => (s?.range ? `${s.range} km` : NA))} better={bestIndex(specsList.map((s) => s?.range ?? null))} />
        <Row label="Charge Time" values={specsList.map((s) => s?.chargeTime ?? NA)} />
      </Section>

      <Section title="Key Features">
        <FeatureRow label="Sunroof" values={specsList.map((s) => s?.features.sunroof ?? false)} />
        <FeatureRow label="Rear Parking Camera" values={specsList.map((s) => s?.features.rearParkingCamera ?? false)} />
        <FeatureRow label="Cruise Control" values={specsList.map((s) => s?.features.cruiseControl ?? false)} />
        <FeatureRow label="Climate Control" values={specsList.map((s) => s?.features.climateControl ?? false)} />
        <FeatureRow label="Keyless Entry" values={specsList.map((s) => s?.features.keylessEntry ?? false)} />
        <FeatureRow label="Push Button Start" values={specsList.map((s) => s?.features.pushButtonStart ?? false)} />
        <FeatureRow label="Android Auto" values={specsList.map((s) => s?.features.androidAuto ?? false)} />
        <FeatureRow label="Apple CarPlay" values={specsList.map((s) => s?.features.appleCarplay ?? false)} />
        <FeatureRow label="LED Headlamps" values={specsList.map((s) => s?.features.ledHeadlamps ?? false)} />
        <FeatureRow label="Alloy Wheels" values={specsList.map((s) => s?.features.alloyWheels ?? false)} />
        <FeatureRow label="Wireless Charging" values={specsList.map((s) => s?.features.wirelessCharging ?? false)} />
        <Row label="NCAP Rating" values={specsList.map((s) => (s?.features.ncapRating ? `${s.features.ncapRating}★` : NA))} />
      </Section>
    </div>
  );
}
