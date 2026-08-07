// components/cars/UsedCarCard.tsx
//
// A used listing is a different object from a model: it has one price
// rather than a range, and its selling points are age, distance and
// ownership. Sizing follows CarCard so the two read as one family in a
// rail, but the content does not overlap enough to share a component.

import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatSinglePrice } from "@/lib/format";
import type { UsedCarListing } from "@/features/usedCars/usedCar.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='225' viewBox='0 0 300 225'%3E%3Crect width='300' height='225' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='13' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

const SIZING = {
  grid: { wrapper: "w-full", sizes: "(max-width: 640px) 90vw, 280px" },
  rail: { wrapper: "w-[272px] shrink-0 snap-start", sizes: "272px" },
} as const;

function km(v: number | null): string {
  if (v === null) return "-";
  return v >= 1000 ? `${Math.round(v / 1000)}k km` : `${v} km`;
}

function owners(v: number | null): string {
  if (v === null) return "-";
  return v === 1 ? "1st owner" : `${v} owners`;
}

export default function UsedCarCard({
  car,
  variant = "grid",
}: {
  car: UsedCarListing;
  variant?: keyof typeof SIZING;
}) {
  const { wrapper, sizes } = SIZING[variant];
  const title = `${car.brandName} ${car.modelName}`;
  const href = routes.model(car.brandSlug, car.modelSlug);

  return (
    <div
      className={`${wrapper} flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow duration-200 hover:shadow-md`}
    >
      <Link href={href} className="relative block aspect-4/3 overflow-hidden bg-page" aria-label={title}>
        <Image
          src={car.imageUrl ?? FALLBACK_IMG}
          alt={title}
          fill
          sizes={sizes}
          className="object-cover"
        />
        {car.isInspected && (
          <span className="absolute left-2.5 top-2.5 rounded-sm bg-surface/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink backdrop-blur-sm">
            Inspected
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-3.5 pb-3.5 pt-3">
        <div className="min-w-0">
          <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
            {car.year ?? "Used"}
          </p>
          <h3 className="truncate text-[15px] font-bold leading-tight text-ink">{title}</h3>
        </div>

        <p className="text-[15.5px] font-bold text-ink tabular-nums">
          {formatSinglePrice(car.price, "Price on request")}
        </p>

        <div className="mt-auto flex items-center gap-1.5 border-t border-border-soft pt-2.5 text-[11px] font-medium text-muted">
          <span className="tabular-nums">{km(car.kmDriven)}</span>
          <span className="text-faint">•</span>
          <span>{owners(car.ownerCount)}</span>
        </div>
      </div>
    </div>
  );
}
