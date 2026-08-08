import Image from "next/image";
import Link from "next/link";
import { ChevronIcon, FuelIcon } from "@/components/common/icons";
import type { FuelName, FuelPoint } from "@/features/fuel/fuel.types";
import { FUEL_LABELS, formatFuelChange, formatFuelDate, formatFuelPrice } from "@/lib/fuel";
import { routes } from "@/lib/routes";

const IMAGE_BY_FUEL: Record<FuelName, string> = {
  petrol: "/design/fuel-prices/petrol-banner.png",
  diesel: "/design/fuel-prices/diesel-banner.png",
  cng: "/design/fuel-prices/cng-banner.png",
};

const ACCENT_BY_FUEL: Record<FuelName, string> = {
  petrol: "text-brand bg-brand-soft",
  diesel: "text-ink bg-page",
  cng: "text-ev bg-ev-soft",
};

export default function FuelSummaryCard({
  fuel,
  point,
  citySlug,
  stateSlug,
}: {
  fuel: FuelName;
  point?: FuelPoint;
  citySlug: string;
  stateSlug: string;
}) {
  if (!point) return null;
  const change = formatFuelChange(point.change);
  const unit = fuel === "cng" ? "kg" : "L";
  const bars = fuel === "petrol" ? [10, 10, 10, 10, 10, 10, 10] : fuel === "diesel" ? [18, 14, 12, 12, 15, 17, 13] : [13, 11, 15, 9, 9, 13, 17];

  return (
    <article className="group overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_26px_70px_-52px_rgba(17,24,39,0.7)] transition duration-300 hover:-translate-y-0.5 hover:border-faint hover:shadow-[0_30px_80px_-54px_rgba(17,24,39,0.85)]">
      <div className="relative aspect-[5.8/1] overflow-hidden border-b border-border-soft bg-page">
        <Image
          src={IMAGE_BY_FUEL[fuel]}
          alt={`${FUEL_LABELS[fuel]} pump detail`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.02),rgba(17,24,39,0.16))]" />
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`flex size-8 items-center justify-center rounded-[6px] ${ACCENT_BY_FUEL[fuel]}`}>
                <FuelIcon className="size-4" />
              </span>
              <p className="text-[12px] font-bold uppercase text-muted">
                {FUEL_LABELS[fuel]}
              </p>
            </div>
            <p className="mt-3 font-head text-[28px] font-extrabold leading-none text-ink tabular-nums sm:text-[32px]">
              {formatFuelPrice(point.price)}
              <span className="ml-1.5 text-[12px] font-semibold text-muted">/ {unit}</span>
            </p>
            <p className={`mt-2 text-[12px] font-semibold tabular-nums ${change.className}`}>
              {change.label}
            </p>
          </div>
          <div className="pt-1 text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">Updated</p>
            <p className="mt-1 text-[11px] font-semibold text-muted">{formatFuelDate(point.updatedOn) ?? point.updatedOn}</p>
          </div>
        </div>

        <div className="mt-5 border-t border-border-soft pt-4">
          <p className={`text-[11px] font-semibold tabular-nums sm:hidden ${change.className}`}>
            7-day status: {change.label}
          </p>
          <div className="hidden grid-cols-7 items-end gap-1 sm:grid">
            {bars.map((height, index) => (
              <span key={`${fuel}-${index}`} className="flex min-w-0 flex-col items-center gap-1">
                <span
                  aria-hidden
                  className={`w-full max-w-7 rounded-[2px] ${fuel === "cng" ? "bg-ev" : fuel === "petrol" ? "bg-brand" : "bg-ink"}`}
                  style={{ height }}
                />
                <span className="text-[9px] font-semibold text-subtle">{["F", "S", "S", "M", "T", "W", "T"][index]}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <Link
            href={routes.fuelPriceInCity(stateSlug, citySlug)}
            className="inline-flex items-center gap-2 text-[12px] font-bold text-brand no-underline transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            View {FUEL_LABELS[fuel].toLowerCase()} details <ChevronIcon className="size-3" />
          </Link>
          <span className="text-[10px] font-semibold text-muted">7-day view</span>
        </div>
      </div>
    </article>
  );
}
