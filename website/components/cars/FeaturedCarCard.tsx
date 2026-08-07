// components/cars/FeaturedCarCard.tsx
//
// The large lead card in the Curated section. Deliberately not a variant
// of CarCard: that card is a tile whose job is to sit in a row of equals,
// while this one leads a section and has room for a description and a
// labelled spec strip. Forcing both through one component would mean a
// prop that reshapes the whole layout, which is two components wearing
// one name.

import Image from "next/image";
import Link from "next/link";
import { BoltIcon, GaugeIcon, StarIcon } from "@/components/common/icons";
import { formatPriceRange, formatSinglePrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { HomeCar } from "@/features/cars/car.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='16' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

function Spec({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-faint">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-ink">{value}</p>
        <p className="truncate text-[11px] text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function FeaturedCarCard({ car }: { car: HomeCar }) {
  const href = routes.model(car.brand.slug, car.slug);
  const isUpcoming = car.launchStatus === "upcoming";
  const price = isUpcoming
    ? formatSinglePrice(car.priceMin, "TBA")
    : formatPriceRange(car.priceMin, car.priceMax);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row">
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="w-fit rounded-sm bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand">
          {isUpcoming ? "Upcoming launch" : "Featured"}
        </span>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {car.brand.name}
          </p>
          <h3 className="text-xl font-bold leading-tight text-ink sm:text-2xl">
            <Link href={href} className="text-ink no-underline hover:text-brand">
              {car.name}
            </Link>
          </h3>
        </div>

        <div>
          <p className="text-lg font-bold text-ink tabular-nums">{price}</p>
          <p className="text-[11px] text-muted">Ex-showroom</p>
        </div>
      </div>

      <Link
        href={href}
        className="relative block min-h-52 flex-1 bg-page sm:min-h-0"
        aria-label={car.name}
      >
        <Image
          src={car.coverImageUrl ?? FALLBACK_IMG}
          alt={`${car.brand.name} ${car.name}`}
          fill
          sizes="(max-width: 640px) 100vw, 340px"
          className="object-cover"
        />
      </Link>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-soft px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {car.isElectric ? (
            <Spec
              icon={<BoltIcon className="size-4" />}
              value={car.specs?.range ? `${car.specs.range} km` : "Electric"}
              label={car.specs?.rangeEstimated ? "Est. real-world range" : "Range"}
            />
          ) : (
            <Spec
              icon={<GaugeIcon className="size-4" />}
              value={car.specs?.powerPs ? `${car.specs.powerPs} PS` : "Petrol"}
              label="Power"
            />
          )}
          {car.bodyType && (
            <Spec icon={<GaugeIcon className="size-4" />} value={car.bodyType.name} label="Body type" />
          )}
          {car.ratingAvg && (
            <Spec
              icon={<StarIcon filled className="size-4 text-amber-400" />}
              value={`${car.ratingAvg}/5`}
              label="Rating"
            />
          )}
        </div>

        <Link
          href={href}
          className="shrink-0 whitespace-nowrap rounded-md border-[1.5px] border-brand px-4 py-2 text-[12px] font-bold text-brand no-underline transition-colors hover:bg-brand-soft"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
