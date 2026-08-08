import Image from "next/image";
import type { FuelHistory, FuelName, FuelPoint } from "@/features/fuel/fuel.types";
import { FUEL_LABELS, formatFuelChange, formatFuelPrice } from "@/lib/fuel";

const IMAGE_BY_FUEL: Record<FuelName, string> = {
  petrol: "/design/fuel-prices/petrol-detail.png",
  diesel: "/design/fuel-prices/diesel-detail.png",
  cng: "/design/fuel-prices/cng-detail.png",
};

// Typical national split, not this city's. We hold no tax data, and the
// share that actually varies between cities is state VAT — which is the
// reason the prices above differ in the first place. Labelled as a
// national illustration so the card cannot be read as a local breakdown.
const COMPOSITION: Record<FuelName, { label: string; value: number; color: string }[]> = {
  petrol: [
    { label: "Base", value: 56, color: "bg-brand" },
    { label: "Central tax", value: 19, color: "bg-[#f59e0b]" },
    { label: "State tax", value: 17, color: "bg-[#f7c768]" },
    { label: "Dealer", value: 8, color: "bg-border" },
  ],
  diesel: [
    { label: "Base", value: 59, color: "bg-ink" },
    { label: "Central tax", value: 16, color: "bg-[#6b7280]" },
    { label: "State tax", value: 17, color: "bg-[#a8adb5]" },
    { label: "Dealer", value: 8, color: "bg-border" },
  ],
  cng: [
    { label: "Gas cost", value: 66, color: "bg-ev" },
    { label: "Tax", value: 14, color: "bg-[#68c6bd]" },
    { label: "Distribution", value: 13, color: "bg-[#a8adb5]" },
    { label: "Dealer", value: 7, color: "bg-border" },
  ],
};

export default function FuelDetailCard({
  fuel,
  point,
  history,
}: {
  fuel: FuelName;
  point: FuelPoint;
  history?: FuelHistory | null;
}) {
  const values = (history?.series ?? []).map((entry) => Number(entry.price)).filter(Number.isFinite);
  const yesterday = values.length > 1 ? values[values.length - 2] : Number(point.price);
  const low = values.length ? Math.min(...values) : Number(point.price);
  const high = values.length ? Math.max(...values) : Number(point.price);
  const unit = fuel === "cng" ? "kg" : "L";
  const change = formatFuelChange(point.change);

  return (
    <article className="grid min-h-[296px] grid-cols-[minmax(0,1fr)_112px] overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_18px_48px_-42px_rgba(17,24,39,0.45)] sm:grid-cols-[minmax(0,1fr)_150px]">
      <div className="min-w-0 p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase text-ink">{FUEL_LABELS[fuel]}</p>
        <p className="mt-2 font-head text-[25px] font-extrabold leading-none text-ink tabular-nums sm:text-[29px]">
          {formatFuelPrice(point.price)}
          <span className="ml-1 text-[10px] font-semibold text-muted">/ {unit}</span>
        </p>
        <p className={`mt-2 text-[11px] font-semibold tabular-nums ${change.className}`}>{change.label}</p>

        <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-border-soft py-3">
          <div>
            <dt className="text-[8.5px] text-subtle">Yesterday</dt>
            <dd className="mt-1 text-[10px] font-bold text-ink tabular-nums">{formatFuelPrice(String(yesterday))}</dd>
          </div>
          <div>
            <dt className="text-[8.5px] text-subtle">30-day low</dt>
            <dd className="mt-1 text-[10px] font-bold text-ink tabular-nums">{formatFuelPrice(String(low))}</dd>
          </div>
          <div>
            <dt className="text-[8.5px] text-subtle">30-day high</dt>
            <dd className="mt-1 text-[10px] font-bold text-ink tabular-nums">{formatFuelPrice(String(high))}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="text-[9px] font-semibold text-muted">Typical price composition (India average)</p>
          <div className="mt-2 flex h-2 overflow-hidden rounded-[2px] bg-page">
            {COMPOSITION[fuel].map((item) => (
              <span key={item.label} className={item.color} style={{ width: `${item.value}%` }} />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {COMPOSITION[fuel].map((item) => (
              <div key={item.label}>
                <p className="truncate text-[7.5px] text-subtle">{item.label}</p>
                <p className="mt-0.5 text-[8.5px] font-bold text-ink tabular-nums">{item.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-l border-border-soft bg-page">
        <Image
          src={IMAGE_BY_FUEL[fuel]}
          alt={`${FUEL_LABELS[fuel]} filling equipment`}
          fill
          sizes="150px"
          className="object-contain"
        />
      </div>
    </article>
  );
}
