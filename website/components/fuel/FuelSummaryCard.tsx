import Image from "next/image";
import Link from "next/link";
import { FuelIcon } from "@/components/common/icons";
import type { FuelName, FuelPoint } from "@/features/fuel/fuel.types";
import { FUEL_LABELS, formatFuelChange, formatFuelPrice } from "@/lib/fuel";
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
}: {
  fuel: FuelName;
  point?: FuelPoint;
  citySlug: string;
}) {
  if (!point) return null;
  const change = formatFuelChange(point.change);
  const unit = fuel === "cng" ? "kg" : "L";

  return (
    <article className="overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_20px_50px_-42px_rgba(17,24,39,0.45)]">
      <div className="relative aspect-[2/1] overflow-hidden border-b border-border-soft bg-page">
        <Image
          src={IMAGE_BY_FUEL[fuel]}
          alt={`${FUEL_LABELS[fuel]} filling equipment`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
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
          <div className="pt-1 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">Updated</p>
            <p className="mt-1 text-[11px] font-semibold text-muted tabular-nums">{point.updatedOn}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border-soft pt-4">
          <Link
            href={routes.fuelPriceInCity(citySlug)}
            className="text-[12px] font-bold text-brand no-underline transition-colors hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            View {FUEL_LABELS[fuel].toLowerCase()} details →
          </Link>
          <div aria-hidden className="flex items-end gap-1">
            {[8, 11, 9, 13, 12, 15, 14].map((height, index) => (
              <span
                key={`${fuel}-${index}`}
                className={`w-1 rounded-[1px] ${fuel === "cng" ? "bg-ev" : fuel === "petrol" ? "bg-brand" : "bg-faint"}`}
                style={{ height }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
