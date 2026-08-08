"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronIcon,
  ClockIcon,
  CompareIcon,
  EditIcon,
  FuelIcon,
  GaugeIcon,
  PercentIcon,
  SeatIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
} from "@/components/common/icons";
import { formatSinglePrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import type {
  CarOption,
  CompareCarResult,
  RandomComparisonPair,
  RandomPairCar,
} from "@/features/compare/compare.types";

const FALLBACK_IMG =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360'%3E%3Crect width='600' height='360' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='15' fill='%239ca3af'%3EImage unavailable%3C/text%3E%3C/svg%3E";

type ShowcaseCar = CompareCarResult | RandomPairCar;

function hasDetails(car: ShowcaseCar): car is CompareCarResult {
  return "specs" in car;
}

function priceValue(car: ShowcaseCar): number | null {
  const raw = hasDetails(car) ? car.selectedVariant?.price ?? car.priceMin : car.priceMin;
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function displayPrice(car: ShowcaseCar): string {
  const raw = hasDetails(car) ? car.selectedVariant?.price ?? car.priceMin : car.priceMin;
  return formatSinglePrice(raw, "Price on request");
}

function displayEfficiency(car: ShowcaseCar): string {
  if (!hasDetails(car) || !car.specs) return "Not listed";
  if (car.isElectric) {
    const range = car.specs.realWorldRange ?? car.specs.claimedRange ?? car.specs.range;
    return range ? `${range} km` : "Range not listed";
  }
  return car.specs.mileage ?? "Mileage not listed";
}

function efficiencyValue(car: ShowcaseCar): number | null {
  if (!hasDetails(car) || !car.specs) return null;
  if (car.isElectric) {
    return car.specs.realWorldRange ?? car.specs.claimedRange ?? car.specs.range;
  }
  const match = car.specs.mileage?.match(/[\d.]+/);
  return match ? Number(match[0]) : null;
}

function displayRating(car: ShowcaseCar): string {
  if (!hasDetails(car) || !car.ratingAvg) return "Not rated";
  return `${Number(car.ratingAvg).toFixed(1)}/5`;
}

function ratingValue(car: ShowcaseCar): number | null {
  if (!hasDetails(car) || !car.ratingAvg) return null;
  const value = Number(car.ratingAvg);
  return Number.isFinite(value) ? value : null;
}

function displayFuel(car: ShowcaseCar): string {
  if (!hasDetails(car)) return "Not listed";
  if (car.isElectric) return "Electric";
  return car.specs?.fuelTypeSubCategory ?? car.specs?.fuelType ?? "Not listed";
}

function displaySeats(car: ShowcaseCar): string {
  if (!hasDetails(car) || !car.specs?.seatingCapacity) return "Not listed";
  return `${car.specs.seatingCapacity} seater`;
}

function insightFor(
  row: "price" | "efficiency" | "rating" | "fuel" | "seats",
  carA: ShowcaseCar,
  carB: ShowcaseCar,
): { label: string; positive?: boolean } {
  if (row === "price") {
    const a = priceValue(carA);
    const b = priceValue(carB);
    if (a == null || b == null) return { label: "Compare prices" };
    if (a === b) return { label: "Same price", positive: true };
    return b < a
      ? { label: "Lower price", positive: true }
      : { label: `${carA.name} costs less` };
  }

  if (row === "efficiency") {
    if (hasDetails(carA) && hasDetails(carB) && carA.isElectric !== carB.isElectric) {
      return { label: "Different measures" };
    }
    const a = efficiencyValue(carA);
    const b = efficiencyValue(carB);
    if (a == null || b == null) return { label: "Check efficiency" };
    if (a === b) return { label: "Similar efficiency", positive: true };
    return b > a
      ? { label: hasDetails(carB) && carB.isElectric ? "Better range" : "Higher mileage", positive: true }
      : { label: `${carA.name} leads` };
  }

  if (row === "rating") {
    const a = ratingValue(carA);
    const b = ratingValue(carB);
    if (a == null || b == null) return { label: "Rating pending" };
    if (a === b) return { label: "Equally rated", positive: true };
    return b > a ? { label: "Higher rating", positive: true } : { label: `${carA.name} rated higher` };
  }

  if (row === "fuel") {
    const a = displayFuel(carA);
    const b = displayFuel(carB);
    if (a === b) return { label: "Same fuel type", positive: true };
    return { label: hasDetails(carB) && carB.isElectric ? "Electric powertrain" : "Different fuels", positive: hasDetails(carB) && carB.isElectric };
  }

  const a = hasDetails(carA) ? carA.specs?.seatingCapacity : null;
  const b = hasDetails(carB) ? carB.specs?.seatingCapacity : null;
  if (!a || !b) return { label: "Check capacity" };
  if (a === b) return { label: "Same space", positive: true };
  return b > a ? { label: "More seats", positive: true } : { label: `${carA.name} has more` };
}

function CarSelector({
  label,
  value,
  options,
  exclude,
  onChange,
}: {
  label: string;
  value: string;
  options: CarOption[];
  exclude: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative flex min-h-14 items-center rounded-[7px] border border-border bg-surface transition-colors hover:border-faint focus-within:border-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand/20">
      <CompareIcon className="pointer-events-none absolute left-4 size-5 text-faint" />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full cursor-pointer appearance-none bg-transparent py-3 pl-11 pr-10 text-[12.5px] font-semibold text-ink outline-none"
      >
        <option value="">{label}</option>
        {options.map((car) => (
          <option key={car.id} value={car.slug} disabled={car.slug === exclude}>
            {car.name.startsWith(car.brand.name) ? car.name : `${car.brand.name} ${car.name}`}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 size-4 text-muted" />
    </label>
  );
}

function PopularComparison({ pair }: { pair: RandomComparisonPair }) {
  const href = routes.comparison(`${pair.carA.slug}-vs-${pair.carB.slug}`);
  return (
    <Link
      href={href}
      className="group/quick grid min-h-[56px] grid-cols-[72px_minmax(0,1fr)_20px] items-center gap-2.5 rounded-[7px] border border-border bg-surface px-2.5 py-2 no-underline transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-faint hover:shadow-[0_10px_28px_-24px_rgba(17,24,39,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0"
    >
      <div className="flex -space-x-4">
        {[pair.carA, pair.carB].map((car) => (
          <span key={car.id} className="relative h-10 w-12 overflow-hidden">
            <Image
              src={car.coverImageUrl ?? FALLBACK_IMG}
              alt=""
              fill
              sizes="48px"
              className="object-contain"
            />
          </span>
        ))}
      </div>
      <p className="line-clamp-2 text-[12px] font-bold leading-[1.45] text-ink">
        {pair.carA.name} vs {pair.carB.name}
      </p>
      <ChevronIcon className="size-4 text-muted transition-transform group-hover/quick:translate-x-0.5 group-hover/quick:text-brand" />
    </Link>
  );
}

function ShowcaseCarHeader({ car }: { car: ShowcaseCar }) {
  const href = hasDetails(car) ? routes.model(car.brand.slug, car.slug) : routes.compare();
  const variant = hasDetails(car) ? car.selectedVariant?.variantName : null;
  return (
    <div className="relative z-10 min-w-0 text-center">
      <Link href={href} className="group/car relative mx-auto block aspect-[3/2] w-full max-w-[200px] sm:max-w-[228px] lg:max-w-[250px]">
        <Image
          src={car.coverImageUrl ?? FALLBACK_IMG}
          alt={`${car.brand.name} ${car.name}`}
          fill
          sizes="(max-width: 640px) 42vw, 360px"
          className="featured-car-cover object-contain p-2 transition-transform duration-500 group-hover/car:scale-[1.025]"
        />
      </Link>
      <div className="mt-1 flex items-center justify-center gap-2">
        <h3 className="truncate font-head text-[16px] font-extrabold text-ink sm:text-[18px]">
          {car.name.startsWith(car.brand.name) ? car.name : `${car.brand.name} ${car.name}`}
        </h3>
        <EditIcon className="size-3.5 shrink-0 text-muted" />
      </div>
      <p className="mt-0.5 truncate text-[12px] text-muted sm:text-[12.5px]">
        {variant ?? (hasDetails(car) && car.isElectric ? "Electric" : "Featured model")}
      </p>
    </div>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-2.5 sm:px-5">
      <span className="flex size-9 shrink-0 items-center justify-center text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-bold text-ink">{title}</p>
        <p className="truncate text-[10.5px] text-muted">{text}</p>
      </div>
    </div>
  );
}

export default function CompareCars({
  pairs,
  featuredCars,
  options,
}: {
  pairs: RandomComparisonPair[];
  featuredCars: CompareCarResult[];
  options: CarOption[];
}) {
  const router = useRouter();
  const [firstCar, setFirstCar] = useState("");
  const [secondCar, setSecondCar] = useState("");
  const featuredPair = pairs[0];

  const showcaseCars = useMemo<ShowcaseCar[]>(() => {
    if (featuredCars.length >= 2) return featuredCars.slice(0, 2);
    return featuredPair ? [featuredPair.carA, featuredPair.carB] : [];
  }, [featuredCars, featuredPair]);

  if (!featuredPair || showcaseCars.length < 2) return null;

  const [carA, carB] = showcaseCars;
  const canCompare = Boolean(firstCar && secondCar && firstCar !== secondCar);
  const rows = [
    { key: "price" as const, icon: <TagIcon className="size-5" />, title: "Price", sub: "Ex-showroom", a: displayPrice(carA), b: displayPrice(carB) },
    { key: "efficiency" as const, icon: <GaugeIcon className="size-5" />, title: hasDetails(carA) && hasDetails(carB) && carA.isElectric && carB.isElectric ? "Range" : "Mileage / range", sub: "Claimed", a: displayEfficiency(carA), b: displayEfficiency(carB) },
    { key: "rating" as const, icon: <StarIcon className="size-5" />, title: "User rating", sub: "Average", a: displayRating(carA), b: displayRating(carB) },
    { key: "fuel" as const, icon: <FuelIcon className="size-5" />, title: "Fuel type", sub: "Powertrain", a: displayFuel(carA), b: displayFuel(carB) },
    { key: "seats" as const, icon: <SeatIcon className="size-5" />, title: "Seats", sub: "Capacity", a: displaySeats(carA), b: displaySeats(carB) },
  ];

  function compareSelected() {
    if (!canCompare) return;
    router.push(routes.comparison(`${firstCar}-vs-${secondCar}`));
  }

  return (
    <section className="relative overflow-hidden bg-surface py-9 sm:py-10 lg:py-11">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(242,101,15,0.045),transparent_25%)]" />
      <div className="relative mx-auto grid max-w-[1536px] gap-7 px-5 sm:px-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-9 xl:grid-cols-[350px_minmax(0,1fr)] xl:gap-10 xl:px-10 2xl:px-0">
        <div className="lg:py-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand sm:text-[12px]">Compare lab</p>
          <span aria-hidden className="mt-3 block h-0.5 w-9 bg-brand" />
          <h2 className="mt-3 max-w-[340px] text-balance font-head text-[27px] font-extrabold leading-[1.06] text-ink sm:text-[32px] xl:text-[35px]">
            Compare cars without the guesswork
          </h2>
          <p className="mt-3 max-w-[340px] text-[13.5px] leading-6 text-muted sm:text-[14.5px]">
            Stack models side by side across price, mileage, ratings, space, and powertrain.
          </p>

          <div className="mt-5 space-y-2.5">
            <CarSelector label="Choose first car" value={firstCar} options={options} exclude={secondCar} onChange={setFirstCar} />
            <CarSelector label="Choose second car" value={secondCar} options={options} exclude={firstCar} onChange={setSecondCar} />
            <button
              type="button"
              onClick={compareSelected}
              disabled={!canCompare}
              className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-[7px] bg-brand px-5 text-[13px] font-bold text-white shadow-[0_16px_32px_-20px_rgba(242,101,15,0.95)] transition-[background-color,transform,opacity] hover:-translate-y-0.5 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              Compare now <ChevronIcon className="size-4" />
            </button>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-[13px] font-bold text-ink">Popular comparisons</p>
            <div className="space-y-2.5">
              {pairs.slice(1, 3).map((pair) => (
                <PopularComparison key={`${pair.carA.id}-${pair.carB.id}`} pair={pair} />
              ))}
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 text-[11.5px] text-muted">
            <span className="flex size-5 items-center justify-center rounded-full border border-brand text-brand">
              <CompareIcon className="size-3" />
            </span>
            Compare two cars at a time
          </p>
        </div>

        <article className="self-start overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_28px_80px_-64px_rgba(17,24,39,0.6)]">
          <div className="relative grid grid-cols-[1fr_56px_1fr] items-start gap-2 overflow-hidden px-4 pb-7 pt-6 sm:grid-cols-[1fr_90px_1fr] sm:px-8 sm:pb-9 sm:pt-8 lg:px-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_46%,rgba(224,224,226,0.95),transparent_34%),radial-gradient(circle_at_75%_46%,rgba(224,224,226,0.95),transparent_34%),radial-gradient(circle,rgba(17,24,39,0.07)_1px,transparent_1px)] [background-size:auto,auto,17px_17px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(to_bottom,transparent,white)]"
            />
            <ShowcaseCarHeader car={carA} />
            <div className="relative z-10 flex h-40 items-center sm:h-44">
              <span aria-hidden className="h-px flex-1 border-t border-dashed border-brand" />
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand bg-white font-head text-[16px] font-extrabold text-brand shadow-[0_10px_24px_-18px_rgba(242,101,15,0.9)] sm:size-16 sm:text-[22px]">
                VS
              </span>
              <span aria-hidden className="h-px flex-1 border-t border-dashed border-brand" />
            </div>
            <ShowcaseCarHeader car={carB} />
          </div>

          <div className="mx-4 overflow-x-auto rounded-[7px] border border-border sm:mx-7 lg:mx-8">
            <div className="min-w-[620px]">
              {rows.map((row) => {
                const insight = insightFor(row.key, carA, carB);
                return (
                  <div key={row.key} className="grid min-h-[56px] grid-cols-[160px_minmax(150px,1fr)_minmax(200px,1.25fr)] border-b border-border-soft last:border-b-0">
                    <div className="flex items-center gap-3 bg-page px-4 py-2 text-muted">
                      <span className="flex size-8 shrink-0 items-center justify-center">{row.icon}</span>
                      <div>
                        <p className="text-[13px] font-bold text-ink">{row.title}</p>
                        <p className="mt-0.5 text-[10.5px] text-muted">{row.sub}</p>
                      </div>
                    </div>
                    <div className="flex items-center border-l border-border-soft px-5 py-2 text-[13px] font-bold text-ink sm:text-[13.5px]">{row.a}</div>
                    <div className="flex items-center justify-between gap-3 border-l border-border-soft px-5 py-2 text-[13px] font-bold text-ink sm:text-[13.5px]">
                      <span>{row.b}</span>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${insight.positive ? "bg-emerald-50 text-emerald-700" : "bg-page text-muted"}`}>
                        {insight.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid border-t border-border-soft bg-page sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border-soft">
            <TrustItem icon={<CompareIcon className="size-5" />} title="Unbiased" text="Independent view" />
            <TrustItem icon={<ShieldIcon className="size-5" />} title="Expert verified" text="Data you can trust" />
            <TrustItem icon={<PercentIcon className="size-5" />} title="Total cost view" text="Beyond sticker price" />
            <TrustItem icon={<ClockIcon className="size-5" />} title="Save and share" text="Keep your compare" />
          </div>
        </article>
      </div>
    </section>
  );
}
