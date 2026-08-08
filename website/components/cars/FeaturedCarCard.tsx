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

// Design assets are served from the CDN like every other upload rather
// than shipped in the Next bundle.
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='16' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

function Spec({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center text-ink">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold text-ink sm:text-[14px]">{value}</p>
        <p className="truncate text-[10.5px] text-muted sm:text-[11px]">{label}</p>
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
  const bodyType = car.bodyType?.name ?? "car";

  return (
    <article className="group flex min-h-[430px] h-full flex-col overflow-hidden rounded-[8px] border border-border bg-surface shadow-[0_24px_70px_-58px_rgba(92,67,45,0.6)]">
      {/* The covers carry a baked-in #E0E0E2 studio plate that cannot be
          keyed out reliably — on a light car the flood fill eats the body.
          So the card is tinted *to* that colour instead: a shadow settles
          the backdrop onto #E0E0E2 where the car sits, leaving its plate
          nothing to butt against, and lifts to white under the copy. */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-surface">
        <Image
          src={`${ASSET_BASE}/uploads/design/curated-model-1-bg.png`}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 830px"
          className="pointer-events-none object-cover object-right"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(90deg,rgb(255,255,255)_0%,rgba(255,255,255,0.94)_16%,rgba(255,255,255,0.18)_30%,rgba(224,224,226,0.55)_40%,rgb(224,224,226)_46%,rgb(224,224,226)_100%)]"
        />

        <div className="relative z-10 flex max-w-[520px] flex-col p-5 sm:p-6 lg:max-w-[52%]">
          <span className="w-fit rounded-[5px] bg-brand-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand">
            {isUpcoming ? "Featured launch" : "Featured pick"}
          </span>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {car.brand.name}
          </p>
          <h3 className="mt-1 font-head text-[24px] font-extrabold leading-tight tracking-[-0.025em] text-ink sm:text-[27px]">
            <Link href={href} className="text-ink no-underline transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              {car.name}
            </Link>
          </h3>
          <p className="mt-3 max-w-[300px] text-[12.5px] leading-5.5 text-muted">
            A {car.isElectric ? "fully electric" : "modern"} {bodyType.toLowerCase()} selected for its balance of comfort, features, and everyday usability.
          </p>

          <div className="mt-5">
            <p className="text-[17px] font-bold text-ink tabular-nums sm:text-[18px]">{price}</p>
            <p className="mt-1 text-[11px] text-muted">Ex-showroom price</p>
          </div>
        </div>

        <div className="relative z-[3] mt-auto min-h-52 sm:min-h-60 lg:absolute lg:inset-y-0 lg:right-0 lg:mt-0 lg:w-[54%]">
          <Link
            href={href}
            className="absolute inset-0 block focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand"
            aria-label={`View ${car.brand.name} ${car.name}`}
          >
            <Image
              src={car.coverImageUrl ?? FALLBACK_IMG}
              alt={`${car.brand.name} ${car.name}`}
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-contain object-bottom p-4 transition-transform duration-500 group-hover:scale-[1.025] lg:p-5"
            />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 border-t border-border-soft px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
          {car.isElectric ? (
            <Spec
              icon={<BoltIcon className="size-5" />}
              value={car.specs?.range ? `${car.specs.range} km` : "Electric"}
              label={car.specs?.rangeEstimated ? "Est. real-world range" : "Range"}
            />
          ) : (
            <Spec
              icon={<GaugeIcon className="size-5" />}
              value={car.specs?.powerPs ? `${car.specs.powerPs} PS` : "Petrol"}
              label="Power"
            />
          )}
          {car.bodyType && (
            <Spec icon={<GaugeIcon className="size-5" />} value={car.bodyType.name} label="Body type" />
          )}
          {car.ratingAvg && (
            <Spec
              icon={<StarIcon filled className="size-5 text-amber-400" />}
              value={`${car.ratingAvg}/5`}
              label="Expert rating"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:flex">
          <Link
            href={href}
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-[6px] border border-faint px-4 py-2 text-[12px] font-bold text-ink no-underline transition-colors hover:border-ink hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            View details
          </Link>
          <Link
            href={href}
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-[6px] bg-brand px-4 py-2 text-[12px] font-bold text-white no-underline shadow-[0_12px_28px_-18px_rgba(242,101,15,0.9)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0"
          >
            {isUpcoming ? "Launch details" : "Check price"}
          </Link>
        </div>
      </div>
    </article>
  );
}
